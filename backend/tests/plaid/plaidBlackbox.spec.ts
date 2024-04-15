import {StatusCodes} from 'http-status-codes'
import axios from 'axios'
import {authenticateAsAdmin, logInTestUser, logOutUser} from '../helpers'
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

            let edwardJones = 'ins_102625'
            let edwardJonesTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                institution_id: edwardJones,
                initial_products: [Products.Transactions]
            }
            let edwardJonesResponse
            try {

            edwardJonesResponse = await plaidClient.sandboxPublicTokenCreate(edwardJonesTokenCreateRequest)
            } catch (e) {
                console.log(e)
            }
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

                for (let account of huntingtonBank.accounts) {
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
                const deleteResponse = await admin.delete(`${process.env.BASE_URL}/api/banks/${huntingtonBankId}`)
                expect(deleteResponse.status).toBe(StatusCodes.NO_CONTENT)
                await logOutUser(client)
                await logOutUser(admin)
            }
        }
    })
})
