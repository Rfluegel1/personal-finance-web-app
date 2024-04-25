import {logInTestUser} from './helpers/logInTestUser.js';
import {expect, test} from '@playwright/test';
import axios from 'axios';
import {wrapper} from 'axios-cookiejar-support';
import {CookieJar} from 'tough-cookie';
import {authenticateAsAdmin, logInTestUserWithClient, logOutUserWithClient} from './helpers/api.js';
import {registerTemporaryUser} from './helpers/registerTemporaryUser.js';

const jar = new CookieJar();
const client = wrapper(axios.create({jar, withCredentials: true}));

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
    await page.click('a[href="/logout"]');

    // then
    await expect(page.locator('h1')).toHaveText('Login');
});

test('should have link to email change', async ({page}) => {
    // given
    await logInTestUser(page);

    // when
    await page.click('a[href="/email-change"]');

    // then
    await expect(page.locator('h1')).toHaveText('Change Email');
});

test('should have link to Password Reset Request', async ({page}) => {
    // given
    await logInTestUser(page);

    // when
    await page.click('a[href="/password-reset-request"]');

    // then
    await expect(page.locator('h1')).toHaveText('Password Reset Request');
});

test('should disable add bank button when link token is not set', async ({page, context}) => {
    // given
    await context.route('**/create_link_token', (route) => {
        route.fulfill({
            status: 500
        });
    });

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('button[id="add-bank"]')).toBeDisabled();
})

async function addHuntingtonBank(page) {
    if (process.env.NODE_ENV === 'development') {
        await page.click('button[id="add-bank"]');
        await page.frameLocator('iframe[title="Plaid Link"]').getByRole('button', {name: 'Continue'}).click();
        await page.frameLocator('iframe[title="Plaid Link"]').getByLabel('Search for 11,000+').fill('huntington');
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

test('should use link flow to add bank and accounts and transactions', async ({page}) => {
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        // given
        await logInTestUser(page);

        try {
            // expect
            await expect(page.locator('.dot').first()).not.toBeVisible();
            await expect(page.locator('svg[id="chart"]')).toBeVisible();

            // when
            await addHuntingtonBank(page);

            // then
            await expect(page.locator('text="Loading..."')).toBeVisible();
            await expect(page.locator('button[id="add-bank"]')).toBeDisabled()

            // and
            await expect(page.locator('text="Loading..."')).not.toBeVisible();
            await expect(page.locator('button[id="add-bank"]')).not.toBeDisabled()

            // then
            await expect(page.locator('text="Huntington Bank"')).toBeVisible({timeout: 10000});
            await page.locator('button[id="Huntington Bank-button"]').click()

            await expect(page.locator('text="$-53501.32"')).toBeVisible();

            let accountsWithTransactions = ['Plaid Checking', 'Plaid Saving', 'Plaid CD', 'Plaid Credit Card', 'Plaid Money Market']
            let accountsWithoutTransactions = ['Plaid IRA', 'Plaid 401k', 'Plaid Student Loan', 'Plaid Mortgage']

            for (let account of accountsWithTransactions) {
                await expect(page.locator(`text="${account}"`)).toBeVisible();
                await page.locator(`button[id="${account}-button"]`).click();
                await expect(page.locator(`table[id="${account}-transactions"]`)).toBeVisible();
            }

            for (let account of accountsWithoutTransactions) {
                await expect(page.locator(`text="${account}"`)).toBeVisible();
                await expect(page.locator(`button[id="${account}-button"]`)).not.toBeVisible()
                await expect(page.locator(`table[id="${account}-transactions"]`)).not.toBeVisible();
            }

            await expect(page.locator('.dot').first()).toBeVisible();
            await expect(page.locator('svg[id="chart"]')).toBeVisible();

            // when
            await page.reload()

            // then
            await expect(page.locator('text="Huntington Bank"')).toBeVisible({timeout: 10000});
            await expect(page.locator('.dot').first()).toBeVisible();
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

test.skip('MOCKED: should fetch bank and accounts and transactions', async ({page, context}) => {
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        // given
        await context.route('**/api/overview', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    banks: [{
                        name: 'Mocked Bank',
                        accounts: [{
                            name: 'Mocked Checking',
                            balances: {current: 320.76},
                            transactions: [{
                                date: '2021-01-01',
                                amount: 100
                            }]
                        }, {
                            name: 'Mocked Savings',
                            balances: {current: 1000.76},
                            transactions: []
                        }]
                    }],
                    netWorths: [{
                        date: '2021-01-01',
                        value: 100,
                        epochTimestamp: 1609459200
                    }, {
                        date: '2021-01-01',
                        value: 200,
                        epochTimestamp: 1709459200
                    }]
                })
            })
        })

        await logInTestUser(page);

        try {
            // expect
            await expect(page.locator('text="Mocked Bank"')).toBeVisible({timeout: 10000});
            await page.locator('button[id="Mocked Bank-button"]').click()

            let accountsWithTransactions = ['Mocked Checking']
            let accountsWithoutTransactions = ['Mocked Savings']

            for (let account of accountsWithTransactions) {
                await expect(page.locator(`text="${account}"`)).toBeVisible();
                await page.locator(`button[id="${account}-button"]`).click();
                await expect(page.locator(`table[id="${account}-transactions"]`)).toBeVisible();
            }

            for (let account of accountsWithoutTransactions) {
                await expect(page.locator(`text="${account}"`)).toBeVisible();
                await expect(page.locator(`button[id="${account}-button"]`)).not.toBeVisible()
                await expect(page.locator(`table[id="${account}-transactions"]`)).not.toBeVisible();
            }

            await expect(page.locator('svg[id="chart"]')).toBeVisible();

            // when
            await page.reload()

            // then
            await expect(page.locator('text="Mocked Bank"')).toBeVisible({timeout: 10000});
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

test('MOCKED: should show when item login is required', async ({page, context}) => {
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        // given
        await logInTestUserWithClient(client)
        const linkTokenResponse = await client.post(`${process.env.BASE_URL}/api/create_link_token`)
        const linkToken = linkTokenResponse.data.link_token;

        let overviewCount = 0
        await context.route('**/api/overview', (route) => {
            overviewCount++
            if (overviewCount === 1) {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        banks: [{
                            name: 'Mocked Bank',
                            accounts: [],
                            error: 'ITEM_LOGIN_REQUIRED'
                        }],
                        netWorths: []
                    })
                })
            } else if (overviewCount === 2) {
                setTimeout(() => route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        banks: [{
                            name: 'Mocked Bank',
                            accounts: [{
                                name: 'Mocked Checking',
                                balances: {current: 320.76},
                                transactions: [{
                                    date: '2021-01-01',
                                    amount: 100
                                }]
                            }, {
                                name: 'Mocked Savings',
                                balances: {current: 1000.76},
                                transactions: []
                            }]
                        }],
                        netWorths: [{
                            date: '2021-01-01',
                            value: 100,
                            epochTimestamp: 1609459200
                        }, {
                            date: '2021-01-01',
                            value: 200,
                            epochTimestamp: 1709459200
                        }]
                    })
                }), 500)
            }
        });
        await context.route('**/api/create_update_link_token', (route) => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    link_token: linkToken
                })
            })
        });

        await logInTestUser(page);

        try {
            // expect
            await expect(page.locator('text="Mocked Bank"')).toBeVisible({timeout: 10000});
            await expect(page.locator('button[id="Mocked Bank-button"]')).not.toBeVisible();
            await expect(page.locator('text="ITEM_LOGIN_REQUIRED"')).toBeVisible();
            await page.locator('button[id="Mocked Bank-login-button"]').click();
            await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();
            await page.frameLocator('#plaid-link-iframe-2').getByLabel('Search for 11,000+').fill('huntington');
            await page.frameLocator('#plaid-link-iframe-2').getByLabel('Huntington Bank').click()
            await page.frameLocator('#plaid-link-iframe-2').getByPlaceholder('Username').fill('user_good');
            await page.frameLocator('#plaid-link-iframe-2').getByPlaceholder('Password').fill('pass_good');
            await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Submit'}).click();
            await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();
            await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();

            await expect(page.locator('text="Loading..."')).toBeVisible();
            await expect(page.locator('text="Loading..."')).not.toBeVisible();
            await expect(page.locator('text="Mocked Bank"')).toBeVisible({timeout: 10000});
            await expect(page.locator('button[id="Mocked Bank-button"]')).toBeVisible();
        } finally {
            // cleanup
            await logOutUserWithClient(client);
        }
    }
})

test('should display error when is verified errors out', async ({page, context}) => {
    // given
    await context.route('**/api/users/is-verified', (route) => {
        route.fulfill({status: 500});
    });

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to verify user"')).toBeVisible();
})

test('should display error when overview errors out', async ({page, context}) => {
    // given
    await context.route('**/api/overview', (route) => {
        route.fulfill({status: 500});
    });

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to get overview"')).toBeVisible();
})

test('should display error when create link token errors out', async ({page, context}) => {
    // given
    await context.route('**/api/create_link_token', (route) => {
        route.fulfill({status: 500});
    });

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to create link token"')).toBeVisible();
})

test('should display error when get overview on success errors out', async ({page, context}) => {
    // given
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        await context.route('**/api/overview', (route) => {
            route.fulfill({status: 500});
        });
        await logInTestUser(page);

        // when
        await addHuntingtonBank(page);

        // then
        await expect(page.locator('text="Failed to get overview"')).toBeVisible();
    }
})

test('should display error when create access token on success errors out', async ({page, context}) => {
    // given
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        await context.route('**/api/exchange_token_and_save_bank', (route) => {
            route.fulfill({status: 500});
        });
        await logInTestUser(page);

        // when
        await addHuntingtonBank(page);

        // then
        await expect(page.locator('text="Failed to save bank"')).toBeVisible();
    }
})

test('should display loading while waiting for overview', async ({page, context}) => {
    // given
    await context.route('**/api/overview', (route) => {
        setTimeout(() => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    banks: [{
                        name: 'Mocked Bank',
                        accounts: [{
                            name: 'Mocked Checking',
                            balances: {current: 320.76},
                            transactions: [{
                                date: '2021-01-01',
                                amount: 100
                            }]
                        }, {
                            name: 'Mocked Savings',
                            balances: {current: 1000.76},
                            transactions: []
                        }]
                    }],
                    netWorths: [{
                        date: '2021-01-01',
                        value: 100,
                        epochTimestamp: 1609459200
                    }, {
                        date: '2021-01-01',
                        value: 200,
                        epochTimestamp: 1709459200
                    }]
                })
            });
        }, 1000);
    });

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Loading..."')).toBeVisible();
    await expect(page.locator('button[id="add-bank"]')).toBeDisabled()


    // and
    await expect(page.locator('text="Loading..."')).not.toBeVisible();
    await expect(page.locator('button[id="add-bank"]')).not.toBeDisabled()
})