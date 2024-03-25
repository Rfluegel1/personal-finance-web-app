import { redirect } from '@sveltejs/kit';
import axios from 'axios';

export async function load() {
	await axios.post('/api/logout')

	throw redirect(302, '/login');
}