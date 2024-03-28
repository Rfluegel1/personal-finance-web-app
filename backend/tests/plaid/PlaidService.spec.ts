import {randomUUID} from 'node:crypto'
import PlaidService from '../../src/plaid/PlaidService'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'

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

            // when
            const result = await plaidService.createLinkToken()

            // then
            expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith({
                'client_name': 'personal-finance-web-app',
                'country_codes': ['US'],
                'language': 'en',
                'user': {
                    'client_user_id': 'plaid-service'
                },
                'products': ['transactions']
            })
            expect(result).toEqual({link_token: mockedLinkToken})
        })

        test('should call to plaid to exchange public token for access token', async () => {
            // given
            let mockedAccessToken = randomUUID()
            plaidClient.itemPublicTokenExchange = jest.fn().mockImplementation((param) => {
                if (param.public_token === 'public_token') {
                    return {data: {access_token: mockedAccessToken}}
                }
            })

            // when
            const result = await plaidService.createAccessToken('public_token')

            // then
            expect(plaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
                'public_token': 'public_token'
            })
            expect(result).toEqual({access_token: mockedAccessToken})
        })
    })
})