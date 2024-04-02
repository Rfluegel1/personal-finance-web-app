<script>
    import {onMount} from 'svelte';
    import axios from 'axios';
    import * as d3 from 'd3';

    let todos = [];
    let task = '';
    let isEmailVerified = false;
    let error = '';
    let banks = [];
    let link_token = '';
    let handler;
    let data = [
        {date: '2023-01-01', epochTimestamp: 1672531200, value: 1000, previousPointPositive: true, realPoint: true},
        {date: '2023-01-16', epochTimestamp: (1672531200 + 1675209600) / 2, value: 0, realPoint: false},
        {date: '2023-02-01', epochTimestamp: 1675209600, value: -1500},
        {date: '2023-03-01', epochTimestamp: 1677628800, value: 2000},
    ].map(d => ({date: new Date(d.epochTimestamp), value: d.value}));

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
        drawChart();
    })

    function drawChart() {
        const margin = {top: 100, right: 100, bottom: 100, left: 100},
            width = 600 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        const svg = d3.select('#chart')
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime().range([0, width]).domain(d3.extent(data, d => d.date));
        const y = d3.scaleLinear().range([height, 0]).domain([d3.min(data, d => d.value) * 1.1, d3.max(data, d => d.value) * 1.1]);

        const line = d3.line().x(d => x(d.date)).y(d => y(d.value));

        // Tooltip setup
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background-color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('border', '1px solid #ccc')
            .style('opacity', 0);

        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(`Date: ${d3.timeFormat('%Y-%m-%d')(d.date)}<br/>Net Worth: ${d.value}`)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 10}px`);
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Draw line
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", line)
            .style("fill", "none")
            .style("stroke", "steelblue")
            .style("stroke-width", "2px");

        // Add the X Axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y-%m-%d')));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add a neutral line at 0 net worth
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("stroke-width", 2)
            .attr("stroke", "black")
            .style("stroke-dasharray", ("3, 3"));
    }

    function initializePlaid() {
        handler = Plaid.create({
            token: link_token,
            onSuccess: async (public_token, metadata) => {
                await axios.post('/api/exchange_token_and_save_bank', {public_token})
                await axios.get('/api/overview').then(response => {
                    banks = response.data
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
    <div class='bank-list'>
        <ol>
            {#each banks as bank}
                <div class='bank-item'>
                    <li>
                        {bank.name}
                        <ol>
                            {#each bank.accounts as account}
                                <li>{account.name}</li>
                            {/each}
                        </ol>
                    </li>
                </div>
            {/each}
        </ol>
    </div>
    <div id="chart-container">
        <svg id="chart"></svg>
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

    .tooltip {
        pointer-events: none; /* Prevents tooltip interference with mouse events */
    }
</style>
