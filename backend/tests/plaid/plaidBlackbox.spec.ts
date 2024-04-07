import {StatusCodes} from 'http-status-codes'
import axios from 'axios'
import {authenticateAsAdmin, logInTestUser, logOutUser} from '../helpers'
import {CookieJar} from 'tough-cookie'
import {wrapper} from 'axios-cookiejar-support'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import {Products, SandboxPublicTokenCreateRequest} from 'plaid'
import Bank from '../../src/banks/Bank'

jest.setTimeout(30000 * 2)

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))
const adminJar = new CookieJar()
const admin = wrapper(axios.create({jar: adminJar, withCredentials: true}))

describe('Plaid resource', () => {
    test('should create a link token', async () => {
        // given
        await logInTestUser(client)

        // when
        const response = await client.post(`${process.env.BASE_URL}/api/create_link_token`)

        // then
        expect(response.status).toBe(StatusCodes.CREATED)
        expect(response.data.link_token).toBeTruthy()

        // cleanup
        await logOutUser(client)
    })

    test('should exchange a public token and create bank and access bank names and access account names', async () => {
        if (process.env.NODE_ENV === 'development') {
            // given
            await authenticateAsAdmin(admin)
            const userId = await logInTestUser(client)
            let huntingtonBank = 'ins_21'
            let sandboxPublicTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                institution_id: huntingtonBank,
                initial_products: [Products.Auth]
            }
            const response = await plaidClient.sandboxPublicTokenCreate(sandboxPublicTokenCreateRequest)
            const publicToken = response.data.public_token
            let bankId: string = ''

            try {
                // when
                const exchangeResponse = await client.post(`${process.env.BASE_URL}/api/exchange_token_and_save_bank`, {public_token: publicToken})

                // then
                expect(exchangeResponse.status).toBe(StatusCodes.CREATED)
                bankId = exchangeResponse.data.bankId
                expect(bankId).toBeTruthy()

                // when
                const banks = await admin.get(`${process.env.BASE_URL}/api/banks?owner=${userId}`)

                // then
                expect(banks.data.banks.find((bank: Bank) => bank.id === bankId)).toBeTruthy()

                // when
                const response = await client.get(`${process.env.BASE_URL}/api/overview`)

                // then
                expect(response.status).toBe(StatusCodes.OK)
                expect(response.data.banks).toEqual([{
                    name: 'Huntington Bank',
                    accounts: [
                        {
                            type: 'depository',
                            name: 'Plaid Checking',
                            balances: {current: 110},
                            transactions: expect.arrayContaining([{amount: 5.4, date: '2024-03-25'}])
                        },
                        {
                            type: 'depository',
                            name: 'Plaid Saving',
                            balances: {current: 210},
                            transactions: expect.arrayContaining([{amount: 25, date: '2024-03-25'}])
                        },
                        {
                            type: 'depository',
                            name: 'Plaid CD',
                            balances: {current: 1000},
                            transactions: expect.arrayContaining([{amount: 1000, date: '2024-03-24'}])
                        },
                        {
                            type: 'credit',
                            name: 'Plaid Credit Card',
                            balances: {current: 410},
                            transactions: expect.arrayContaining([{amount: 500, date: '2024-04-04'}])
                        },
                        {
                            type: 'depository',
                            name: 'Plaid Money Market',
                            balances: {current: 43200},
                            transactions: expect.arrayContaining([{amount: 5850, date: '2024-03-24'}])
                        },
                        {
                            type: 'investment',
                            name: 'Plaid IRA',
                            balances: {current: 320.76},
                            transactions: []
                        },
                        {
                            type: 'investment',
                            name: 'Plaid 401k',
                            balances: {current: 23631.9805},
                            transactions: []
                        },
                        {
                            type: 'loan',
                            name: 'Plaid Student Loan',
                            balances: {current: 65262},
                            transactions: []
                        },
                        {
                            type: 'loan',
                            name: 'Plaid Mortgage',
                            balances: {current: 56302.06},
                            transactions: []
                        },
                    ]
                }])
                for (let netWorth of response.data.netWorths) {
                    expect(netWorth.date).toMatch(/\d{4}-\d{2}-\d{2}/)
                    expect(netWorth.value).toEqual(expect.any(Number))
                    expect(netWorth.epochTimestamp).toEqual(expect.any(Number))
                }
            } finally {
                // cleanup
                const deleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${bankId}`)
                expect(deleteResponse.status).toBe(StatusCodes.NO_CONTENT)
                await logOutUser(client)
                await logOutUser(admin)
            }
        }
    })
})
