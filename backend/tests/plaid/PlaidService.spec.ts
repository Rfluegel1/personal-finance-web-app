import {randomUUID} from 'node:crypto'
import PlaidService from '../../src/plaid/PlaidService'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import Bank from '../../src/banks/Bank'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        }
    })
}))

describe('Plaid service', () => {
    const plaidService = new PlaidService()
    describe('in regards to normal operation', () => {
        test('should call to plaid and return link token', async () => {
            // given
            let mockedLinkToken = randomUUID()
            plaidClient.linkTokenCreate = jest.fn().mockResolvedValue({data: {link_token: mockedLinkToken}})
            let userId = 'user'

            // when
            const result = await plaidService.createLinkToken(userId)

            // then
            expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                'client_name': 'personal-finance-web-app',
                'country_codes': ['US'],
                'language': 'en',
                'user': {
                    'client_user_id': userId
                },
                'products': ['transactions']
            })
            expect(result).toEqual({link_token: mockedLinkToken})
        })

        test('should call to plaid to exchange public token for access token and to bank', async () => {
            // given
            let mockedAccessToken = randomUUID()
            let mockedBankId = randomUUID()
            plaidClient.itemPublicTokenExchange = jest.fn().mockImplementation((param) => {
                if (param.public_token === 'public_token') {
                    return {data: {access_token: mockedAccessToken}}
                }
            })
            plaidService.bankService.createBank = jest.fn().mockImplementation((accessToken, owner) => {
                if (accessToken === mockedAccessToken && owner === 'user') {
                    const bank = new Bank(accessToken, owner)
                    bank.id = mockedBankId
                    return bank
                }
            })

            // when
            const result = await plaidService.exchangeTokenAndSaveBank('public_token', 'user')

            // then
            expect(result).toEqual({bankId: mockedBankId})
        })
    })
})