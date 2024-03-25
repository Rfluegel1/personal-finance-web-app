import { expect, test } from '@playwright/test';
import { logInTestUser } from './helpers/logInTestUser.js';

test.describe('Logout page', () => {
	test('should log user out and redirect to login', async ({ page }) => {
		// given
		await logInTestUser(page);

		// when
		await page.goto('/logout');

		// then
		await expect(page.locator('h1')).toHaveText('Login');
	});
});