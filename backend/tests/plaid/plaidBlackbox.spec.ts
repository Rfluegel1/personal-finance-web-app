import {StatusCodes} from 'http-status-codes'
import axios from 'axios'
import {authenticateAsAdmin, logInTestUser, logOutUser, onlyRunIfDevelopment} from '../helpers'
import {CookieJar} from 'tough-cookie'
import {wrapper} from 'axios-cookiejar-support'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import {Products, SandboxPublicTokenCreateRequest} from 'plaid'
import Bank from '../../src/banks/Bank'

jest.setTimeout(30000 * 100)

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

    test('should create a update link token', async () => {
        // given
        onlyRunIfDevelopment()

        await authenticateAsAdmin(admin)
        await logInTestUser(client)
        let huntingtonBank = 'ins_21'
        let huntingtonBankTokenCreateRequest: SandboxPublicTokenCreateRequest = {
            institution_id: huntingtonBank,
            initial_products: [Products.Transactions]
        }
        let huntingtonBankResponse
        huntingtonBankResponse = await plaidClient.sandboxPublicTokenCreate(huntingtonBankTokenCreateRequest)
        const huntingtonBankPublicToken = huntingtonBankResponse?.data?.public_token
        let huntingtonBankId: string = ''

        try {
            const huntingtonBankExchangeResponse = await client.post(`${process.env.BASE_URL}/api/exchange_token_and_save_bank`, {public_token: huntingtonBankPublicToken})
            huntingtonBankId = huntingtonBankExchangeResponse.data.bankId
            const getBankResponse = await admin.get(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
            const huntingtonBankAccessToken = getBankResponse.data.accessToken
            let waitForPlaidApiToBeReadyInLieuOfAddingRetryLogic = async () => {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
            await waitForPlaidApiToBeReadyInLieuOfAddingRetryLogic()
            const transactionsGetResponse = await plaidClient.transactionsGet({
                access_token: huntingtonBankAccessToken,
                start_date: '2021-01-01',
                end_date: '2021-01-31'
            })
            const item_id = transactionsGetResponse.data.item.item_id

            // when
            const response = await client.post(`${process.env.BASE_URL}/api/create_update_link_token`, {itemId: item_id})

            // then
            expect(response.status).toBe(StatusCodes.CREATED)
            expect(response.data.link_token).toBeTruthy()
        } catch (e) {
            console.error(e)
        } finally {
            // cleanup
            const huntingtonDeleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
            expect(huntingtonDeleteResponse.status).toBe(StatusCodes.NO_CONTENT)
            await logOutUser(client)
            await logOutUser(admin)
        }
    })

    test('should exchange a public token and update the access token of existing bank', async () => {
        // given
        if (process.env.NODE_ENV === 'development') {
            await authenticateAsAdmin(admin)
            const userId = await logInTestUser(client)

            let huntingtonBank = 'ins_21'
            let huntingtonBankTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                institution_id: huntingtonBank,
                initial_products: [Products.Transactions]
            }
            let huntingtonBankResponse
            huntingtonBankResponse = await plaidClient.sandboxPublicTokenCreate(huntingtonBankTokenCreateRequest)
            const huntingtonBankPublicToken = huntingtonBankResponse?.data?.public_token
            let huntingtonBankId: string = ''
            try {

                const huntingtonBankExchangeResponse = await client.post(`${process.env.BASE_URL}/api/exchange_token_and_save_bank`, {public_token: huntingtonBankPublicToken})

                // expect
                expect(huntingtonBankExchangeResponse.status).toBe(StatusCodes.CREATED)
                huntingtonBankId = huntingtonBankExchangeResponse.data.bankId
                expect(huntingtonBankId).toBeTruthy()

                const getBankResponse = await admin.get(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
                const startingAccessToken = getBankResponse.data.accessToken

                // when
                let secondHuntingtonBankTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                    institution_id: huntingtonBank,
                    initial_products: [Products.Transactions]
                }
                let secondHuntingtonBankResponse
                secondHuntingtonBankResponse = await plaidClient.sandboxPublicTokenCreate(secondHuntingtonBankTokenCreateRequest)
                const secondHuntingtonBankPublicToken = secondHuntingtonBankResponse?.data?.public_token
                const huntingtonBankUpdateResponse = await client.post(`${process.env.BASE_URL}/api/exchange_token_and_update_bank`, {
                    publicToken: secondHuntingtonBankPublicToken,
                    bankId: huntingtonBankId
                })

                // then
                expect(huntingtonBankUpdateResponse.status).toBe(StatusCodes.CREATED)
                const updatedBankResponse = await admin.get(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
                const updatedAccessToken = updatedBankResponse.data.accessToken
                expect(updatedAccessToken).not.toEqual(startingAccessToken)
            } finally {
                // cleanup
                const huntingtonDeleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
                expect(huntingtonDeleteResponse.status).toBe(StatusCodes.NO_CONTENT)
                await logOutUser(client)
                await logOutUser(admin)
            }
        }
    })

    test('should exchange a public token and create bank and access bank names and access account names', async () => {
        if (process.env.NODE_ENV === 'development') {
            // given
            await authenticateAsAdmin(admin)
            const userId = await logInTestUser(client)

            let huntingtonBank = 'ins_21'
            let huntingtonBankTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                institution_id: huntingtonBank,
                initial_products: [Products.Transactions]
            }
            let huntingtonBankResponse
            huntingtonBankResponse = await plaidClient.sandboxPublicTokenCreate(huntingtonBankTokenCreateRequest)
            const huntingtonBankPublicToken = huntingtonBankResponse?.data?.public_token
            let huntingtonBankId: string = ''

            let edwardJones = 'ins_115607'
            let edwardJonesTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                institution_id: edwardJones,
                initial_products: [Products.Investments]
            }
            let edwardJonesResponse
            edwardJonesResponse = await plaidClient.sandboxPublicTokenCreate(edwardJonesTokenCreateRequest)
            const edwardJonesPublicToken = edwardJonesResponse?.data?.public_token
            let edwardJonesId: string = ''

            try {
                // when
                const huntingtonBankExchangeResponse = await client.post(`${process.env.BASE_URL}/api/exchange_token_and_save_bank`, {public_token: huntingtonBankPublicToken})

                // then
                expect(huntingtonBankExchangeResponse.status).toBe(StatusCodes.CREATED)
                huntingtonBankId = huntingtonBankExchangeResponse.data.bankId
                expect(huntingtonBankId).toBeTruthy()
                // when
                const edwardJonesExchangeResponse = await client.post(`${process.env.BASE_URL}/api/exchange_token_and_save_bank`, {public_token: edwardJonesPublicToken})

                // then
                expect(edwardJonesExchangeResponse.status).toBe(StatusCodes.CREATED)
                edwardJonesId = edwardJonesExchangeResponse.data.bankId
                expect(edwardJonesId).toBeTruthy()

                // when
                const banks = await admin.get(`${process.env.BASE_URL}/api/banks?owner=${userId}`)

                // then
                expect(banks.data.banks.find((bank: Bank) => bank.id === huntingtonBankId)).toBeTruthy()
                expect(banks.data.banks.find((bank: Bank) => bank.id === edwardJonesId)).toBeTruthy()

                // when
                const response = await client.get(`${process.env.BASE_URL}/api/overview`)

                // then
                expect(response.status).toBe(StatusCodes.OK)
                let huntingtonBank = response.data.banks.find((bank: any) => bank.name === 'Huntington Bank')
                expect(huntingtonBank.itemId).toBeTruthy()

                let plaidChecking = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid Checking')
                expect(plaidChecking.type).toBe('depository')
                expect(plaidChecking.balances.current).toEqual(110)
                expect(plaidChecking.transactions.length).toBeGreaterThan(0)

                let plaidSaving = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid Saving')
                expect(plaidSaving.type).toBe('depository')
                expect(plaidSaving.balances.current).toEqual(210)
                expect(plaidSaving.transactions.length).toBeGreaterThan(0)

                let plaidCD = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid CD')
                expect(plaidCD.type).toBe('depository')
                expect(plaidCD.balances.current).toEqual(1000)
                expect(plaidCD.transactions.length).toBeGreaterThan(0)

                let plaidCreditCard = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid Credit Card')
                expect(plaidCreditCard.type).toBe('credit')
                expect(plaidCreditCard.balances.current).toEqual(410)
                expect(plaidCreditCard.transactions.length).toBeGreaterThan(0)

                let plaidMoneyMarket = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid Money Market')
                expect(plaidMoneyMarket.type).toBe('depository')
                expect(plaidMoneyMarket.balances.current).toEqual(43200)
                expect(plaidMoneyMarket.transactions.length).toBeGreaterThan(0)

                let plaidIRA = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid IRA')
                expect(plaidIRA.type).toBe('investment')
                expect(plaidIRA.balances.current).toEqual(320.76)
                expect(plaidIRA.transactions.length).toBe(0)

                let plaid401k = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid 401k')
                expect(plaid401k.type).toBe('investment')
                expect(plaid401k.balances.current).toEqual(23631.9805)
                expect(plaid401k.transactions.length).toBe(0)

                let plaidStudentLoan = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid Student Loan')
                expect(plaidStudentLoan.type).toBe('loan')
                expect(plaidStudentLoan.balances.current).toEqual(65262)
                expect(plaidStudentLoan.transactions.length).toBe(0)

                let plaidMortgage = huntingtonBank.accounts.find((account: any) => account.name === 'Plaid Mortgage')
                expect(plaidMortgage.type).toBe('loan')
                expect(plaidMortgage.balances.current).toEqual(56302.06)
                expect(plaidMortgage.transactions.length).toBe(0)

                let edwardJones = response.data.banks.find((bank: any) => bank.name === 'Edward Jones - U.S. Clients Access')
                expect(edwardJones.itemId).toBeTruthy()

                let edwardJonesIRA = edwardJones.accounts.find((account: any) => account.name === 'Plaid IRA')
                expect(edwardJonesIRA.type).toBe('investment')
                expect(edwardJonesIRA.balances.current).toEqual(320.76)
                expect(edwardJonesIRA.transactions.length).toBeGreaterThan(0)

                let edwardJones401k = edwardJones.accounts.find((account: any) => account.name === 'Plaid 401k')
                expect(edwardJones401k.type).toBe('investment')
                expect(edwardJones401k.balances.current).toEqual(23631.9805)
                expect(edwardJones401k.transactions.length).toBeGreaterThan(0)

                for (let account of huntingtonBank.accounts.concat(edwardJones.accounts)) {
                    for (let transaction of account.transactions) {
                        expect(transaction.date).toMatch(/\d{4}-\d{2}-\d{2}/)
                        expect(transaction.amount).toEqual(expect.any(Number))
                    }
                }

                for (let netWorth of response.data.netWorths) {
                    expect(netWorth.date).toMatch(/\d{4}-\d{2}-\d{2}/)
                    expect(netWorth.value).toEqual(expect.any(Number))
                    expect(netWorth.epochTimestamp).toEqual(expect.any(Number))
                }
            } finally {
                // cleanup
                const huntingtonDeleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
                expect(huntingtonDeleteResponse.status).toBe(StatusCodes.NO_CONTENT)
                const edwardJonesDeleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${edwardJonesId}`)
                expect(edwardJonesDeleteResponse.status).toBe(StatusCodes.NO_CONTENT)
                await logOutUser(client)
                await logOutUser(admin)
            }
        }
    })

    test('should see error when ITEM_LOGIN_REQUIRED is returned from plaid', async () => {
        if (process.env.NODE_ENV === 'development') {
            // given
            const userId = await logInTestUser(client)
            await authenticateAsAdmin(admin)

            let nockedHuntingtonBankAccessToken = 'access-sandbox-0201a6f0-be45-4f47-bc69-c30f6b1e248a'
            let huntingtonBankId: string = ''
            try {


                // expect
                const bankPostResponse = await admin.post(`${process.env.BASE_URL}/api/banks`, {
                    accessToken: nockedHuntingtonBankAccessToken,
                    itemId: 'item-sandbox-0201a6f0-be45-4f47-bc69-c30f6b1e248a',
                })

                expect(bankPostResponse.status).toBe(StatusCodes.CREATED)
                huntingtonBankId = bankPostResponse.data.id
                expect(huntingtonBankId).toBeTruthy()

                const updateBankResponse = await admin.put(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`, {
                    owner: userId,
                })
                expect(updateBankResponse.status).toBe(StatusCodes.OK)

                // when
                const response = await client.get(`${process.env.BASE_URL}/api/overview`)

                // then
                expect(response.status).toBe(StatusCodes.OK)
                expect(response.data.banks.length).toBe(1)
                expect(response.data.banks[0].name).toBe('Huntington Bank')
                expect(response.data.banks[0].error).toBe('ITEM_LOGIN_REQUIRED')
            } finally {
                // cleanup
                const huntingtonDeleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
                expect(huntingtonDeleteResponse.status).toBe(StatusCodes.NO_CONTENT)
                await logOutUser(client)
                await logOutUser(admin)
            }
        }
    })
})
