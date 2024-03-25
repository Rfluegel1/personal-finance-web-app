import { expect, test } from '@playwright/test';
import { authenticateAsAdmin, logOutUserWithClient } from './helpers/api.js';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';
import { registerTemporaryUser } from './helpers/registerTemporaryUser.js';
test.describe('Password Reset page', () => {
	test('should call to password reset with token and password form', async ({
																																							page
																																						}) => {
		// given
		const jar = new CookieJar();
		const admin = wrapper(axios.create({ jar, withCredentials: true }));
		await authenticateAsAdmin(admin);
		let userId;
		let passwordRestToken = '49a5211c-8cec-41bd-94d3-a79b7b2f3931';
		try {
			const email = await registerTemporaryUser(page);
			const getResponse = await admin.get(`${process.env.BASE_URL}/api/users?email=${email}`)
			userId = getResponse.data.id;
			await admin.put(`${process.env.BASE_URL}/api/users/${userId}`,
				{ passwordReset: {token: passwordRestToken, expiration: new Date(Date.now() + 1000 * 60 * 60)} }
			);

			await page.goto(`/reset-password?token=${passwordRestToken}`);
			await page.fill('input[id="password"]', 'new-password');
			await page.fill('input[id="confirmPassword"]', 'new-password');

			// when
			await page.click('button[type="submit"]');

			// then
			await expect(page.locator('text="Password reset successfully"')).toBeVisible();
		} finally {
			await admin.delete(`${process.env.BASE_URL}/api/users/${userId}`);
			await logOutUserWithClient(admin)
		}
	});

	test('should display error message when request fails', async ({ page }) => {
		// given
		await page.goto('/reset-password');
		await page.fill('input[id="password"]', 'new-password');
		await page.fill('input[id="confirmPassword"]', 'new-password');

		// when
		await page.click('button[type="submit"]');

		// then
		await page.waitForSelector(`text="Something went wrong. Please try again."`);
	});

	test('should have link to login page', async ({ page }) => {
		// given
		await page.goto('/reset-password');

		// when
		await page.click('a[href="/login"]');

		// then
		await expect(page.locator('h1')).toHaveText('Login');
	});
});