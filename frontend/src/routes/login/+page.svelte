<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { StatusCodes } from 'http-status-codes';

	let email = '';
	let password = '';
	let error = '';

	onMount(async () => {
		if ((await axios.get('/api/session-check')).data.sessionActive) {
			await goto('/');
		}
	});

	async function handleSubmit() {
		try {
			const data = new URLSearchParams();
			data.append('username', email);
			data.append('password', password);
			await axios.post('/api/login', data, {
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
				}
			);
			await goto('/');
		} catch (e) {
			if (e.response.status === StatusCodes.UNAUTHORIZED) {
				error = 'Invalid email or password.';
			} else {
				error = 'Something went wrong. Please try again.'
			}
		}
	}
</script>

<main>
	<h1>Login</h1>
	<form on:submit|preventDefault={handleSubmit}>
		<div>
			<label for='email'>Email:</label>
			<input type='email' id='email' bind:value={email} required />
		</div>

		<div>
			<label for='password'>Password:</label>
			<input type='password' id='password' bind:value={password} required />
		</div>

		<button type='submit'>Login</button>
	</form>
		<a href="/register">Create Account</a>
		<a href="/password-reset-request">Reset Password</a>
	{#if error}
		<div class='error' role='alert'>{error}</div>
	{/if}
</main>

<style>
    .error {
        color: red;
    }
</style>
