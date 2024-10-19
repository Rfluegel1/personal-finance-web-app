import {logInTestUser} from './helpers/logInTestUser.js';
import {expect, test} from '@playwright/test';
import axios from 'axios';
import {wrapper} from 'axios-cookiejar-support';
import {CookieJar} from 'tough-cookie';
import {logInTestUserWithClient, logOutUserWithClient} from './helpers/api.js';
import data from '../tests/overviewResponse.json' assert {type: 'json'};

const jar = new CookieJar();
const client = wrapper(axios.create({jar, withCredentials: true}));

const isNotDevelopment = process.env.NODE_ENV !== 'development';

const okBody = JSON.stringify(data)

const itemLoginRequiredBody = JSON.stringify({
    banks: [{
        name: 'Huntington Bank',
        accounts: [],
        error: 'ITEM_LOGIN_REQUIRED'
    }],
    netWorths: []
});

async function mockInternalServerError(context, url) {
    await context.route(url, (route) => {
        route.fulfill({status: 500});
    });
}

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

async function updateBank(page) {
    await page.locator('button[id="Huntington Bank-login-button"]').click();
    await page.frameLocator('#plaid-link-iframe-2').getByRole('button', {name: 'Continue'}).click();
    await page.frameLocator('#plaid-link-iframe-2').getByLabel('Search for 12,000+').fill('huntington');
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
    if (isNotDevelopment) {
        return
    }
    test.setTimeout(30000);

    // given
    await context.route('**/api/overview', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: okBody
        })
    })
    await logInTestUser(page);

    // expect
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible({timeout: 10000});

    await page.getByRole('button', { name: 'Cash 4 Accounts $' }).click()
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

    await page.getByRole('button', { name: 'Credit 1 Accounts $' }).click()
    await page.getByRole('button', { name: `Plaid Credit Card $` }).click()
    await expect(page.locator(`table[id="Plaid Credit Card-transactions"]`)).toBeVisible();

    await page.getByRole('button', { name: 'Loan 2 Accounts $' }).click()
    let loanAccounts = ['Plaid Student Loan', 'Plaid Mortgage']
    for (let account of loanAccounts) {
        await page.getByRole('button', { name: `${account} $` }).click()
        await expect(page.locator(`table[id="${account}-transactions"]`)).not.toBeVisible();
    }

    await expect(page.locator('svg[id="chart"]')).toBeVisible();

    // when
    await page.reload()

    // then
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible({timeout: 10000});
    await expect(page.locator('svg[id="chart"]')).toBeVisible();
})

test.skip('should show when item login is required', async ({page, context}) => {
    if (isNotDevelopment) {
        return
    }
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
                body: itemLoginRequiredBody
            })
        } else if (overviewCount === 2) {
            setTimeout(() => route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: okBody
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
        await expect(page.locator('text="Huntington Bank"')).toBeVisible({timeout: 10000});
        await expect(page.locator('button[id="Huntington Bank-button"]')).not.toBeVisible();
        await expect(page.locator('text="ITEM_LOGIN_REQUIRED"')).toBeVisible();
        await updateBank(page);

        await expect(page.locator('text="Loading..."')).toBeVisible();
        await expect(page.locator('text="Loading..."')).not.toBeVisible();
        await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible()
    } finally {
        // cleanup
        await logOutUserWithClient(client);
    }
})

test.skip('should show error when update on success overview return error', async ({page, context}) => {
    if (isNotDevelopment) {
        return
    }
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
                body: itemLoginRequiredBody
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

    // expect
    await expect(page.locator('text="Huntington Bank"')).toBeVisible({timeout: 10000});
    await expect(page.locator('button[id="Huntington Bank-button"]')).not.toBeVisible();
    await expect(page.locator('text="ITEM_LOGIN_REQUIRED"')).toBeVisible();

    try {
        // when
        await updateBank(page)

        // then
        await expect(page.locator('text="Failed to get overview"')).toBeVisible();
    } finally {
        // cleanup
        await logOutUserWithClient(client);
    }
})

test.skip('should show error when update link token return error and disable link for bank', async ({page, context}) => {
    if (isNotDevelopment) {
        return
    }
    test.setTimeout(30000);

    // given
    await context.route('**/api/overview', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: itemLoginRequiredBody
        })
    });
    await mockInternalServerError(context, '**/api/create_update_link_token')

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to create update link token"')).toBeVisible();
    await expect(page.locator('button[id="Huntington Bank-login-button"]')).toBeDisabled();
})

test.skip('should display error when is verified errors out', async ({page, context}) => {
    // given
    await mockInternalServerError(context, '**/api/users/is-verified')

    // when
    await logInTestUser(page);

    // then
    await expect(page.locator('text="Failed to verify user"')).toBeVisible();
})

test.skip('should display error when overview errors out', async ({page, context}) => {
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

test.skip('should display error when get overview on success errors out', async ({page, context}) => {
    if (isNotDevelopment) {
        return
    }
    test.setTimeout(30000);

    // given
    await mockInternalServerError(context, '**/api/overview');
    await logInTestUser(page);

    // when
    await addHuntingtonBank(page);

    // then
    await expect(page.locator('text="Failed to get overview"')).toBeVisible();
})

test.skip('should display error when create access token on success errors out', async ({page, context}) => {
    if (isNotDevelopment) {
        return
    }
    test.setTimeout(30000);

    // given
    await mockInternalServerError(context, '**/api/exchange_token_and_save_bank')
    await logInTestUser(page);

    // when
    await addHuntingtonBank(page);

    // then
    await expect(page.locator('text="Failed to save bank"')).toBeVisible();
})

test('should display loading while waiting for overview and disable add bank button', async ({page, context}) => {
    // given
    await context.route('**/api/overview', (route) => {
        setTimeout(() => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: okBody
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

test('should change graph range when buttons are selected', async ({page, context}) => {
    // given
    await context.route('**/api/overview', (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: okBody
        });
    });
    await logInTestUser(page);

    let previousChart = await page.waitForSelector('#chart', {state: 'visible'});
    let previousSvgHtml = await previousChart.innerHTML();

    let chart
    let svgHtml

    let rangeIds = ['1M', '3M', '6M', 'YTD', '1Y', '2Y']

    for (let rangeId of rangeIds) {
        // when
        await page.click(`button[id="${rangeId}"]`);

        // then
        chart = await page.locator('#chart');
        svgHtml = await chart.innerHTML();

        expect(previousSvgHtml).not.toEqual(svgHtml);

        previousChart = chart;
        previousSvgHtml = svgHtml;
    }
})