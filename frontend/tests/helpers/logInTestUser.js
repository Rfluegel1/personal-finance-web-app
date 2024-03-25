import { expect } from '@playwright/test';

export async function logInTestUser(
	page,
	email = 'cypressdefault@gmail.com',
	password = process.env.TEST_USER_PASSWORD,
	waitForNavigation = true
) {
	await page.goto('/login');

	await page.fill('input[type="email"]', email);
	await page.fill('input[type="password"]', password);

	await page.click('button[type="submit"]');

	if (waitForNavigation) {
		await expect(page.locator('h1')).toHaveText('Todo List');
	}
}