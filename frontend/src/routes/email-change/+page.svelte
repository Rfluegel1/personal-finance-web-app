<script>
	import axios from 'axios';

	let email = '';
	let message = '';

	async function handleChangeEmail() {
		try {
			await axios.post('/api/request-email-change', { email })
			message = `Request sent to ${email} with further instructions`;
			email = '';
		} catch (error) {
			message = 'Something went wrong. Please try again.';
		}
	}
</script>

<main>
	<h1>Change Email</h1>
	<form on:submit|preventDefault={handleChangeEmail}>
		<label for="email">New Email:</label>
		<input type="email" id="email" bind:value={email} required />
		<button type="submit">Submit</button>
	</form>
	{#if message}
		<p>{message}</p>
	{/if}
	<a href="/">Back to Todo List</a>
</main>
