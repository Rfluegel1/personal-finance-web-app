import {randomUUID} from 'node:crypto'
import PlaidService from '../../src/plaid/PlaidService'
import axios from 'axios'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        };
    })
}));

describe('Plaid service', () => {
    const plaidService = new PlaidService();
    describe('in regards to normal operation', () => {
        test('should call to plaid and return link token', async () => {
            // given
            let mockedLinkToken = randomUUID();
            axios.post = jest.fn().mockResolvedValue({data: {link_token: mockedLinkToken}})

            // when
            const result = await plaidService.createLinkToken()

            // then
            expect(axios.post).toHaveBeenCalledWith(`${process.env.PLAID_URL}/link/token/create`, {
                'client_id': '64fbc6e226a0f70017bcd313',
                'secret': process.env.PLAID_SECRET,
                'client_name': 'personal-finance-web-app',
                'country_codes':  ['US'],
                'language':  'en',
                'user': {
                    'client_user_id': 'health-check'
                },
                'products': ['transactions']
            })
            expect(result).toEqual({ link_token: mockedLinkToken })
        })

        test('should call to plaid to exchange public token for access token', async () => {
            // given
            let mockedAccessToken = randomUUID();
            axios.post = jest.fn().mockResolvedValue({data: {access_token: mockedAccessToken}})

            // when
            const result = await plaidService.createAccessToken('public_token')

            // then
            expect(axios.post).toHaveBeenCalledWith(`${process.env.PLAID_URL}/item/public_token/exchange`, {
                'client_id': '64fbc6e226a0f70017bcd313',
                'secret': process.env.PLAID_SECRET,
                'public_token': 'public_token'
            })
            expect(result).toEqual({ access_token: mockedAccessToken })
        })
    })
})