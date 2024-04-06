<script>
    import {onMount} from 'svelte';
    import axios from 'axios';
    import * as d3 from 'd3';
    import drawChart from "$lib/drawGraph.js";

    let todos = [];
    let task = '';
    let isEmailVerified = false;
    let error = '';
    let banks = [];
    let link_token = '';
    let handler;
    let netWorths = [];

    onMount(async () => {
        if ((await axios.get('/api/users/is-verified')).data.isVerified) {
            isEmailVerified = true;
            const response = await axios.get('/api/todos');
            todos = response.data.message;
        }
    });

    onMount(async () => {
        const linkTokenResponse = await axios.post('/api/create_link_token')
        link_token = linkTokenResponse.data.link_token
        if (typeof Plaid !== 'undefined') {
            initializePlaid();
        }
    });

    onMount(async () => {
        await axios.get('/api/overview').then(response => {
            banks = response.data.banks
            netWorths = response.data.netWorths
        })
        drawChart(netWorths);
    })

    $: netWorths, drawChart(netWorths);

    function initializePlaid() {
        handler = Plaid.create({
            token: link_token,
            onSuccess: async (public_token, metadata) => {
                await axios.post('/api/exchange_token_and_save_bank', {public_token})
                await axios.get('/api/overview').then(response => {
                    banks = response.data.banks
                    netWorths = response.data.netWorths
                })
                console.log('Success', public_token, metadata);
            },
            onExit: (err, metadata) => {
                if (err) {
                    console.error('Plaid Link exit error:', err);
                }
            }
        });
    }


    async function createTask() {
        if (!task) {
            error = 'Task is required';
            return;
        }
        error = '';
        await axios.post('/api/todos', {task: task});
        const response = await axios.get('/api/todos');
        todos = response.data.message;
        task = '';
    }

    async function deleteTask(id) {
        await axios.delete(`/api/todos/${id}`);
        const response = await axios.get('/api/todos');
        todos = response.data.message;
    }
</script>

<svelte:head>
    <script
            src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
    ></script>
</svelte:head>

<main>
    <h1>Todo List</h1>
    {#if isEmailVerified}
        <div class='todo-list'>
            <ol>
                {#each todos as todo (todo.id)}
                    <div class='todo-item'>
                        <li data-testid={todo.task}>{todo.task}</li>
                        <button data-testid='delete {todo.task}' on:click={() => deleteTask(todo.id)}>X</button>
                    </div>
                {/each}
            </ol>
        </div>
        <form>
            <input id='task' bind:value={task}/>
            <button id='create' on:click={createTask}>Create Task</button>
            {#if error}
                <div class='error' role='alert'>{error}</div>
            {/if}
        </form>
        <div>
            <a href='/logout'>Logout</a>
        </div>
        <div>
            <a href='/email-change'>Change Email</a>
        </div>
        <div>
            <a href='/password-reset-request'>Change Password</a>
        </div>
    {:else}
        <div class='error' role='alert'>Please verify your email address</div>
    {/if}
    <button id='add-bank' on:click={handler.open()} disabled={!link_token}>Add Bank</button>
    <div id="chart-container">
        {#if netWorths.length !== 0}
            <svg id="chart"></svg>
        {/if}
    </div>
    <div class='bank-list'>
        <ol>
            {#each banks as bank}
                <div class='bank-item'>
                    <li>
                        {bank.name}
                        <ol>
                            {#each bank.accounts as account}
                                <li>{account.name}</li>
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Transaction Value</th>
                                        <th>Transaction Date</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {#each account.transactions as transaction}
                                        <tr>
                                            <td>{transaction.amount}</td>
                                            <td>{transaction.date}</td>
                                        </tr>
                                    {/each}
                                    </tbody>
                                </table>
                            {/each}
                        </ol>
                    </li>
                </div>
            {/each}
        </ol>
    </div>
</main>

<style>
    .error {
        color: red;
    }

    .todo-item {
        display: flex;
        align-items: center;
    }

    .todo-item button {
        margin-left: 10px;
    }
</style>
