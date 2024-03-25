import { expect, test } from '@playwright/test';
import { generateTemporaryUserEmail } from './helpers/generateTemporaryUserEmail.js';
import { logInTestUser } from './helpers/logInTestUser.js';
import { registerTemporaryUser } from './helpers/registerTemporaryUser.js';

test.describe('Email change page', () => {
	test('should route to login if not logged in', async ({ page }) => {
		// given
		await page.goto('/email-change');

		// expect
		await expect(page.locator('h1')).toHaveText('Login');
	});

	test('should call to email change for logged in user', async ({ page }) => {
		const email = await registerTemporaryUser(page)
		const newEmail = generateTemporaryUserEmail()
		await logInTestUser(page, email, 'password12');

		// when
		await page.goto('/email-change');
		await page.fill('input[type="email"]', newEmail);
		await page.click('button[type="submit"]');

		// then
		await page.waitForSelector(`text="Request sent to ${newEmail} with further instructions"`);
		await expect(page.locator('input[type=email]')).toHaveValue('');

		// when
		await page.click('a[href="/"]');

		// then
		await expect(page.locator('h1')).toHaveText('Todo List');
	});

	test('should display error message when request fails', async ({ page, context }) => {
		// given
		await context.route('**/request-email-change', (route) => {
			route.fulfill({
				status: 500
			});
		});
		await logInTestUser(page);

		// when
		await page.goto('/email-change');
		await page.fill('input[type="email"]', generateTemporaryUserEmail());
		await page.click('button[type="submit"]');

		// then
		await page.waitForSelector(`text="Something went wrong. Please try again."`);
	});

	test('should have link to todo list page', async ({ page }) => {
		// given
		await logInTestUser(page);
		await page.goto('/email-change');

		// when
		await page.click('a[href="/"]');

		// then
		await expect(page.locator('h1')).toHaveText('Todo List');
	});
});