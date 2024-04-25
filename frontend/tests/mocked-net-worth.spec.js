import {logInTestUser} from './helpers/logInTestUser.js';
import {expect, test} from '@playwright/test';
import axios from 'axios';
import {wrapper} from 'axios-cookiejar-support';
import {CookieJar} from 'tough-cookie';
import { logInTestUserWithClient, logOutUserWithClient} from './helpers/api.js';

const jar = new CookieJar();
const client = wrapper(axios.create({jar, withCredentials: true}));

async function mockInternalServerError(context, url) {
    await context.route(url, (route) => {
        route.fulfill({status: 500});
    });
}
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

async function updateBank(page) {
    await page.locator('button[id="Mocked Bank-login-button"]').click();
    await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();
    await page.frameLocator('#plaid-link-iframe-2').getByLabel('Search for 11,000+').fill('huntington');
    await page.frameLocator('#plaid-link-iframe-2').getByLabel('Huntington Bank').click()
    await page.frameLocator('#plaid-link-iframe-2').getByPlaceholder('Username').fill('user_good');
    await page.frameLocator('#plaid-link-iframe-2').getByPlaceholder('Password').fill('pass_good');
    await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Submit'}).click();
    await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();
    await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();
}


test('should disable add bank button when link token is not set', async ({page, context}) => {
    // given
    await mockInternalServerError(context, '**/create_link_token')

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('button[id="add-bank"]')).toBeDisabled();
})

test('should fetch bank and accounts and transactions', async ({page, context}) => {
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

    }
})

test('should show when item login is required', async ({page, context}) => {
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
            await updateBank(page);

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

test('should show error when update on success overview return error', async ({page, context}) => {
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
                route.fulfill({status: 500});
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
            await expect(page.locator('text="Mocked Bank"')).toBeVisible({timeout: 10000});
            await expect(page.locator('button[id="Mocked Bank-button"]')).not.toBeVisible();
            await expect(page.locator('text="ITEM_LOGIN_REQUIRED"')).toBeVisible();
            await updateBank(page)

            await expect(page.locator('text="Failed to get overview"')).toBeVisible();
        } finally {
            // cleanup
            await logOutUserWithClient(client);
        }
    }
})

test('should show error when update link token return error', async ({page, context}) => {
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
                        accounts: [],
                        error: 'ITEM_LOGIN_REQUIRED'
                    }],
                    netWorths: []
                })
            })
        });
        await mockInternalServerError(context, '**/api/create_update_link_token')

        await logInTestUser(page);

        await expect(page.locator('text="Failed to create update link token"')).toBeVisible();
    }
})

test('should display error when is verified errors out', async ({page, context}) => {
    // given
    await mockInternalServerError(context, '**/api/users/is-verified')

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to verify user"')).toBeVisible();
})

test('should display error when overview errors out', async ({page, context}) => {
    // given
    await mockInternalServerError(context, '**/api/overview')

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to get overview"')).toBeVisible();
})

test('should display error when create link token errors out', async ({page, context}) => {
    // given
    await mockInternalServerError(context, '**/api/create_link_token')

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to create link token"')).toBeVisible();
})

test('should display error when get overview on success errors out', async ({page, context}) => {
    // given
    if (process.env.NODE_ENV === 'development') {
        test.setTimeout(30000);
        await mockInternalServerError(context, '**/api/overview');
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
        await mockInternalServerError(context, '**/api/exchange_token_and_save_bank')
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