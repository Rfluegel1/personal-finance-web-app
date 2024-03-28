import axios from 'axios'
import {plaidClient} from './PlaidConfiguration'
import {CountryCode, LinkTokenCreateRequest, Products} from 'plaid'

export default class PlaidService {
    async createLinkToken(): Promise<any> {
        const plaidRequest: LinkTokenCreateRequest = {
            'client_name': 'personal-finance-web-app',
            'country_codes': [CountryCode.Us],
            'language': 'en',
            'user': {
                'client_user_id': 'plaid-service'
            },
            'products': [Products.Transactions]
        }
        let response = await plaidClient.linkTokenCreate(plaidRequest)
        return {link_token: response.data.link_token}
    }

    async createAccessToken(publicToken: string): Promise<any> {
        let response = await plaidClient.itemPublicTokenExchange({
            'public_token': publicToken
        })
        return {access_token: response.data.access_token}
    }
}