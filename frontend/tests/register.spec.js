import { expect, test } from '@playwright/test';
import { registerTemporaryUser } from './helpers/registerTemporaryUser.js';
import { logInTestUser } from './helpers/logInTestUser.js';
import { logInTestUserWithClient } from './helpers/api.js';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';

test('should have link to login page', async ({ page }) => {
	// given
	await page.goto('/register');

	// when
	await page.click('a[href="/login"]');

	// then
	await expect(page.locator('h1')).toHaveText('Login');
});

test('should display mismatched password and passwordConfirm error', async ({ page }) => {
	// when
	await registerTemporaryUser(page, undefined, 'password12', 'password123', false);

	// then
	await expect(page.locator('text="Password and Confirm Password do not match"')).toBeVisible();
});

test('should register a new user', async ({ page }) => {
	// given
	let email;
	const jar = new CookieJar();
	const client = wrapper(axios.create({ jar, withCredentials: true }));

	try {
		// when
		email = await registerTemporaryUser(page);

		// then
		await expect(page.locator('text="Email verification sent. Login "')).toBeVisible();

		// when
		await page.click('a[href="/login"]');

		// then
		await expect(page.locator('h1')).toHaveText('Login');

		// when
		await logInTestUser(page, email, 'password12');

		// then
		await expect(page.locator('h1')).toHaveText('Net Worth');
	} finally {
		// cleanup
		try {
			await logInTestUserWithClient(client, email, 'password12');
			const userId = (await client.get(`${process.env.BASE_URL}/api/users?email=${email}`)).data.id;
			await client.delete(`${process.env.BASE_URL}/api/users/${userId}`);
		} catch (e) {
			if (e.message !== 'Cannot read properties of undefined (reading \'id\')') {
				throw e;
			}
		}
	}
});

test('user creation error displays message to client', async ({ page }) => {
	// given
	let email;
	const jar = new CookieJar();
	const client = wrapper(axios.create({ jar, withCredentials: true }));

	try {
		email = await registerTemporaryUser(page);
		await page.goto('/register');

		// when
		await registerTemporaryUser(page, email, 'password12', 'password12', false);

		// then
		await expect(
			page.locator('text="There was an error registering your account"')
		).toBeVisible();
	} finally {
		try {
			await logInTestUserWithClient(client, email, 'password12');
			const userId = (await client.get(`${process.env.BASE_URL}/api/users?email=${email}`)).data.id;
			await client.delete(`${process.env.BASE_URL}/api/users/${userId}`);
		} catch (e) {
			if (e.message !== 'Cannot read properties of undefined (reading \'id\')') {
				throw e;
			}
		}
	}
});