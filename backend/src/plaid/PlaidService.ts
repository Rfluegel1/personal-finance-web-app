import {plaidClient} from './PlaidConfiguration'
import {CountryCode, LinkTokenCreateRequest, Products} from 'plaid'
import BankService from '../banks/BankService'

export default class PlaidService {
    bankService = new BankService()
    async createLinkToken(userId: string): Promise<any> {
        const plaidRequest: LinkTokenCreateRequest = {
            'client_name': 'personal-finance-web-app',
            'country_codes': [CountryCode.Us],
            'language': 'en',
            'user': {
                'client_user_id': userId
            },
            'products': [Products.Transactions]
        }
        let response = await plaidClient.linkTokenCreate(plaidRequest)
        return {link_token: response.data.link_token}
    }

    async exchangeTokenAndSaveBank(publicToken: string, userId: string): Promise<any> {
        let response = await plaidClient.itemPublicTokenExchange({
            'public_token': publicToken
        })
        let bankId = (await this.bankService.createBank(response.data.access_token, userId)).id
        return {bankId: bankId}
    }
}