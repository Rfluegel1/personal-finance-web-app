import { expect, test } from '@playwright/test';
import { logInTestUser } from './helpers/logInTestUser.js';

test('valid login should redirect to main page', async ({ page }) => {
	// when
	await logInTestUser(page);

	// then
	await expect(page.locator('h1')).toHaveText('Net Worth');
});

test('invalid login displays error message', async ({ page }) => {
	// when
	await logInTestUser(page, 'invalid@invalid.invalid', 'invalid', false);

	// then
	await expect(
		page.locator('text="Invalid email or password."')).toBeVisible();
});

test('logged in user should be redirected to main page when visiting login page', async ({
																																													page
																																												}) => {
	// given
	await logInTestUser(page);

	// when
	await page.goto('/login');

	// then
	await expect(page.locator('h1')).toHaveText('Net Worth');
});

test('should display other error message', async ({ page, context }) => {
	// given
	await context.route('**/api/login', (route) => {
		route.fulfill({
			status: 500
		});
	});

	// when
	await logInTestUser(page, 'invalid@invalid.invalid', 'invalid', false);

	// then
	await expect(page.locator('text="Something went wrong. Please try again."')).toBeVisible();
});

test('link to create user routes to register page', async ({ page }) => {
	// given
	await page.goto('/login');

	// when
	await page.click('a[href="/register"]');

	// then
	await expect(page.locator('h1')).toHaveText('Register');
});

test('should link to Password Reset Request page', async ({ page }) => {
	// given
	await page.goto('/login');

	// when
	await page.click('a[href="/password-reset-request"]');

	// then
	await expect(page.locator('h1')).toHaveText('Password Reset Request');
});