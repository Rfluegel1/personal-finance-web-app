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
        await expect(page.locator('div[role="alert"]', { hasText: 'Please verify your email address' })).toBeVisible();
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
            await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible({timeout: 10000});
            await expect(page.locator('text="-$40,452"')).toBeVisible();
            await page.getByRole('button', { name: 'Cash 6 Accounts $' }).click()
            let cashAccouts = ['Plaid Checking', 'Plaid Saving', 'Plaid CD', 'Plaid Money Market']
            for (let account of cashAccouts) {
                await page.getByRole('button', { name: `${account} $` }).click()
                await expect(page.locator(`table[id="${account}-transactions"]`)).toBeVisible();
            }

            await page.getByRole('button', { name: 'Investment 2 Accounts $' }).click()
            let investmentAccounts = ['Plaid IRA', 'Plaid 401k']
            for (let account of investmentAccounts) {
                await page.getByRole('button', { name: `${account} $` }).click()
                await expect(page.locator(`table[id="${account}-transactions"]`)).not.toBeVisible();
            }

            await page.getByRole('button', { name: 'Credit 2 Accounts $' }).click()
            await page.getByRole('button', { name: `Plaid Credit Card $` }).click()
            await expect(page.locator(`table[id="Plaid Credit Card-transactions"]`)).toBeVisible();

            await page.getByRole('button', { name: 'Loan 2 Accounts $' }).click()
            let loanAccounts = ['Plaid Student Loan', 'Plaid Mortgage']
            for (let account of loanAccounts) {
                await page.getByRole('button', { name: `${account} $` }).click()
                await expect(page.locator(`table[id="${account}-transactions"]`)).not.toBeVisible();
            }

            await expect(page.locator('rect')).toBeVisible();
            await expect(page.locator('svg[id="chart"]')).toBeVisible();

            // when
            await page.reload()

            // then
            await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible({timeout: 10000});
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