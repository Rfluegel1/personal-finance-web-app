<script>
	import axios from 'axios';

	let email = '';
	let message = '';

	async function handleSubmit() {
		try {
			await axios.post('/api/request-password-reset', { email });
			message = `If an account exists for ${email}, an email will be sent with further instructions`;
			email = '';
		} catch (error) {
			message = 'Something went wrong. Please try again.';
		}
	}
</script>

<main>
	<h1>Password Reset Request</h1>
	<form on:submit|preventDefault={handleSubmit}>
		<label for="email">Email:</label>
		<input type="email" id="email" bind:value={email} required />
		<button type="submit">Submit</button>
	</form>
	{#if message}
		<div>{message}</div>
	{/if}
	<a href="/login">Login</a>
</main>
