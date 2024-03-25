import { expect, test } from '@playwright/test';
import { generateTemporaryUserEmail } from './helpers/generateTemporaryUserEmail.js';

test.describe('Password Reset Request page', () => {
	test('should call to Password Reset Request when email is submitted and link to login', async ({
																																																	 page
																																																 }) => {
		// given
		await page.goto('/password-reset-request');
		let email = generateTemporaryUserEmail();
		await page.fill('input[type="email"]', email);

		// when
		await page.click('button[type="submit"]');

		// then
		await page.waitForSelector(
			`text="If an account exists for ${email}, an email will be sent with further instructions"`
		);
		await expect(page.locator('input[type=email]')).toHaveValue('');

		// when
		await page.click('a[href="/login"]');

		// then
		await expect(page.locator('h1')).toHaveText('Login');
	});

	test('should display error message when request fails', async ({ page, context }) => {
		// given
		await context.route('**/request-password-reset', (route) => {
			route.fulfill({
				status: 500
			});
		});
		await page.goto('/password-reset-request');
		await page.fill('input[type="email"]', generateTemporaryUserEmail());

		// when
		await page.click('button[type="submit"]');

		// then
		await page.waitForSelector(`text="Something went wrong. Please try again."`);
	});

	test('should have link to login page', async ({ page }) => {
		// given
		await page.goto('/password-reset-request');

		// when
		await page.click('a[href="/login"]');

		// then
		await expect(page.locator('h1')).toHaveText('Login');
	});
});
