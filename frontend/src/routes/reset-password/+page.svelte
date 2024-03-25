<script>
	import axios from 'axios';
	import { onMount } from 'svelte';

	let password = '';
	let confirmPassword = '';
	let token = '';
	let message = '';

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		token = params.get('token');
	});

	async function handleSubmit() {
		try {
			await axios.put(`/api/reset-password?token=${token}`,
				{ password: password, confirmPassword: confirmPassword }
			);
			message = 'Password reset successfully';
			password = '';
		} catch (error) {
			message = 'Something went wrong. Please try again.';
		}
	}
</script>

<main>
	<h1>Reset Password</h1>
	<form on:submit|preventDefault={handleSubmit}>
		<label for='password'>Password:</label>
		<input type='password' id='password' bind:value={password} required />
		<label for='confirmPassword'>Confirm Password:</label>
		<input type='password' id='confirmPassword' bind:value={confirmPassword} required />
		<button type='submit'>Submit</button>
	</form>
	{#if message}
			<div>{message}</div>
		{/if}
		<a href="/login">Login</a>
</main>
