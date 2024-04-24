if (process.env.NODE_ENV === 'test') {
    process.env.NODE_ENV = 'development'
}
const env = process.env.NODE_ENV || 'development'
require('dotenv').config({path: `.env.${env}`})

import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import {Products} from 'plaid'
import DataSourceService from '../../src/dataSource/DataSourceService'
import app from '../../src/app'
import supertestSession = require('supertest-session')

async function ensureTestUser(email: string, password: string, testSession: any) {
    try {
        await authenticateAsAdmin(testSession)
        const response = await testSession.get(`/api/users?email=${email}`)

        if (response.status === 200) {
            return response.body.id
        }
    } catch (error: any) {
        // Check if user was not found and create them
        if (error.response && error.response.status === 404) {
            const createResponse = await testSession.post('/api/users', {
                email: email, password: password, confirmPassword: password
            })

            expect(createResponse.status).toBe(201)
            return createResponse.body.id
        } else {
            throw error
        }
    }
}

async function logInTestUser(testSession: any, email = 'cypressdefault@gmail.com', password = process.env.TEST_USER_PASSWORD) {
    const userId = await ensureTestUser(email, password || '', testSession)

    const data = new URLSearchParams()
    data.append('username', email)
    data.append('password', password || '')

    const logInResponse = await testSession.post('/api/login')
        .send(data.toString())
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .redirects(10)

    expect(logInResponse.status).toEqual(200) // Using direct number for clarity
    return userId // or however you extract userId
}

async function logOutUser(testSession: any) {
    const logOutResponse = await testSession.post('/api/logout')
        .redirects(10)

    expect(logOutResponse.status).toEqual(200) // Using direct number for clarity
    return logOutResponse
}

async function authenticateAsAdmin(testSession: any) {
    const data = new URLSearchParams()
    data.append('username', process.env.ADMIN_EMAIL || '')
    data.append('password', process.env.ADMIN_PASSWORD || '')

    const logInResponse = await testSession.post('/api/login')
        .send(data.toString())
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .redirects(10)

    expect(logInResponse.status).toEqual(200)
}

jest.setTimeout(30000)
test('should see error when ITEM_LOGIN_REQUIRED is returned from plaid', async () => {
    if (process.env.NODE_ENV === 'development') {
        const nock = require('nock')
        const plaidBaseUrl = 'https://sandbox.plaid.com'
        nock(plaidBaseUrl, {allowUnmocked: true})
            .post('/transactions/get', () => true)
            .reply(400, {error_code: 'ITEM_LOGIN_REQUIRED'})

        await DataSourceService.getInstance().initialize()

        const client = supertestSession(app) // Create a session instance of supertest-session
        const userId = await logInTestUser(client)

        const admin = supertestSession(app) // Create a session instance of supertest-session
        await authenticateAsAdmin(admin)

        let huntingtonBank = 'ins_21'
        let huntingtonBankTokenCreateRequest = {
            institution_id: huntingtonBank,
            initial_products: [Products.Transactions] // Assuming Products.Transactions is 'transactions'
        }
        let huntingtonBankResponse = await plaidClient.sandboxPublicTokenCreate(huntingtonBankTokenCreateRequest)
        const huntingtonBankPublicToken = huntingtonBankResponse?.data?.public_token

        let huntingtonBankId = ''
        try {
            // Direct API call using supertest instead of `client`
            const huntingtonBankExchangeResponse = await client
                .post('/api/exchange_token_and_save_bank')
                .send({public_token: huntingtonBankPublicToken})

            expect(huntingtonBankExchangeResponse.status).toBe(201) // StatusCodes.CREATED
            huntingtonBankId = huntingtonBankExchangeResponse.body.bankId
            expect(huntingtonBankId).toBeTruthy()

            // Continue with other API interactions
            const getBankResponse = await admin
                .get(`/api/banks/${huntingtonBankId}`)

            expect(getBankResponse.status).toBe(200) // StatusCodes.OK
            const huntingtonBankAccessToken = getBankResponse.body.accessToken

            const updateBankResponse = await admin
                .put(`/api/banks/${huntingtonBankId}`)
                .send({
                    owner: userId,
                    accessToken: huntingtonBankAccessToken
                })

            expect(updateBankResponse.status).toBe(200) // StatusCodes.OK

            // Final GET request to check the outcome
            const response = await client
                .get('/api/overview')

            expect(response.status).toBe(200) // StatusCodes.OK
            expect(response.body.banks.length).toBe(1)
            expect(response.body.banks[0].name).toBe('Huntington Bank')
            expect(response.body.banks[0].error).toBe('ITEM_LOGIN_REQUIRED')
        } finally {
            // Cleanup
            await admin
                .delete(`/api/banks/${huntingtonBankId}`)
            await logOutUser(client)
            await logOutUser(admin)
            admin.destroy()
            client.destroy()
            await DataSourceService.getInstance().destroy()
        }
    }
})
