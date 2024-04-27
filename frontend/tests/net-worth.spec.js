import {logInTestUser} from './helpers/logInTestUser.js';
import {expect, test} from '@playwright/test';
import axios from 'axios';
import {wrapper} from 'axios-cookiejar-support';
import {CookieJar} from 'tough-cookie';
import {authenticateAsAdmin, logInTestUserWithClient, logOutUserWithClient} from './helpers/api.js';
import {registerTemporaryUser} from './helpers/registerTemporaryUser.js';

const jar = new CookieJar();
const client = wrapper(axios.create({jar, withCredentials: true}));

async function addHuntingtonBank(page) {
    if (process.env.NODE_ENV === 'development') {
        await page.click('button[id="add-bank"]');
        await page.frameLocator('iframe[title="Plaid Link"]').getByRole('button', {name: 'Continue'}).click();
        await page.frameLocator('iframe[title="Plaid Link"]').getByLabel('Search for 12,000+').fill('huntington');
        await page.frameLocator('iframe[title="Plaid Link"]').getByLabel('Huntington Bank').click()
        await page.frameLocator('iframe[title="Plaid Link"]').getByPlaceholder('Username').fill('user_good');
        await page.frameLocator('iframe[title="Plaid Link"]').getByPlaceholder('Password').fill('pass_good');
        await page.frameLocator('iframe[title="Plaid Link"]').getByRole('button', {name: 'Submit'}).click();
        await page.frameLocator('iframe[title="Plaid Link"]').getByRole('button', {name: 'Continue'}).click();
        await page.frameLocator('iframe[title="Plaid Link"]').getByRole('button', {name: 'Continue'}).click();
    } else {
        throw new Error('This test can only be run in development mode');
    }
}

test('should redirect when user is not logged in', async ({page}) => {
    // given
    await page.goto('/logout');

    // when
    await page.goto('/');

    // then
    await expect(page.locator('h1')).toHaveText('Login');
});

test('user without email verification cannot add banks, and is asked to verify', async ({
                                                                                            page
                                                                                        }) => {
    // given
    let email;
    const jar = new CookieJar();
    const client = wrapper(axios.create({jar, withCredentials: true}));
    try {
        email = await registerTemporaryUser(page);

        // when
        await logInTestUser(page, email, 'password12');

        // then
        await expect(page.locator('button[id="add-bank"]')).not.toBeVisible();
        await expect(page.locator('div[role="alert"]')).toHaveText(
            'Please verify your email address'
        );
    } finally {
        // cleanup
        const userId = await logInTestUserWithClient(client, email, 'password12');
        await client.delete(`${process.env.BASE_URL}/api/users/${userId}`);
    }
});

test('should have link that logs user out', async ({page}) => {
    // given
    await logInTestUser(page);

    // when
    await page.getByRole('button', { name: '☰' }).click()
    await page.click('a[href="/logout"]');

    // then
    await expect(page.locator('h1')).toHaveText('Login');
});

test('should have link to email change', async ({page}) => {
    // given
    await logInTestUser(page);

    // when
    await page.getByRole('button', { name: '☰' }).click()
    await page.click('a[href="/email-change"]');

    // then
    await expect(page.locator('h1')).toHaveText('Change Email');
});

test('should have link to Password Reset Request', async ({page}) => {
    // given
    await logInTestUser(page);

    // when
    await page.getByRole('button', { name: '☰' }).click()
    await page.click('a[href="/password-reset-request"]');

    // then
    await expect(page.locator('h1')).toHaveText('Password Reset Request');
});

test('should use link flow to add bank and accounts and transactions', async ({page}) => {
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        // given
        await logInTestUser(page);

        try {
            // expect chart to not yet be drawn
            await expect(page.locator('rect')).not.toBeVisible();
            await expect(page.locator('svg[id="chart"]')).toBeVisible();

            // when
            await addHuntingtonBank(page);

            // then data is displayed with graph
            await expect(page.locator('text="Huntington Bank"')).toBeVisible({timeout: 10000});
            await page.click('button[id="Huntington Bank-button"]')

            await expect(page.locator('text="-$53,501.32"')).toBeVisible();

            let accountsWithTransactions = ['Plaid Checking', 'Plaid Saving', 'Plaid CD', 'Plaid Credit Card', 'Plaid Money Market']
            let accountsWithoutTransactions = ['Plaid IRA', 'Plaid 401k', 'Plaid Student Loan', 'Plaid Mortgage']

            for (let account of accountsWithTransactions) {
                await expect(page.locator(`text="${account}"`)).toBeVisible();
                await page.click(`button[id="${account}-button"]`)
                await expect(page.locator(`table[id="${account}-transactions"]`)).toBeVisible();
            }

            for (let account of accountsWithoutTransactions) {
                await expect(page.locator(`text="${account}"`)).toBeVisible();
                await expect(page.locator(`button[id="${account}-button"]`)).not.toBeVisible()
                await expect(page.locator(`table[id="${account}-transactions"]`)).not.toBeVisible();
            }

            await expect(page.locator('rect')).toBeVisible();
            await expect(page.locator('svg[id="chart"]')).toBeVisible();

            // when
            await page.reload()

            // then
            await expect(page.locator('text="Huntington Bank"')).toBeVisible({timeout: 10000});
            await expect(page.locator('rect')).toBeVisible();
            await expect(page.locator('svg[id="chart"]')).toBeVisible();
        } finally {
            // cleanup
            await authenticateAsAdmin(client);
            const userResponse = await client.get(`${process.env.BASE_URL}/api/users?email=cypressdefault@gmail.com`);
            const userId = userResponse.data.id;
            const bankResponse = await client.get(`${process.env.BASE_URL}/api/banks?owner=${userId}`);
            for (const bank of bankResponse.data.banks) {
                await client.delete(`${process.env.BASE_URL}/api/banks/${bank.id}`);
            }
            await logOutUserWithClient(client);
        }
    }
})