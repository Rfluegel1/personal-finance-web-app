<script>
	import { onMount } from 'svelte';
	import axios from 'axios';

	let todos = [];
	let task = '';
	let isEmailVerified = false;
	let error = '';


	onMount(async () => {
		if ((await axios.get('/api/users/is-verified')).data.isVerified) {
			isEmailVerified = true;
			const response = await axios.get('/api/todos');
			todos = response.data.message;
		}
	});

	async function createTask() {
		if (!task) {
			error = 'Task is required';
			return;
		}
		error = '';
		await axios.post('/api/todos', { task: task });
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
			<input id='task' bind:value={task} />
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
	<button id='add-bank'>Add Bank</button>
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
