import {plaidClient} from './PlaidConfiguration'
import {
    CountryCode,
    InstitutionsGetByIdRequest,
    LinkTokenCreateRequest,
    Products
} from 'plaid'
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

    async getOverview(userId: string): Promise<any> {
        let overview = []
        const banks = await this.bankService.getBanksByOwner(userId)
        for (let bank of banks) {
            let accountsResponse = await plaidClient.accountsGet({
                access_token: bank.accessToken
            })
            let institutionResponse = await plaidClient.institutionsGetById({
                institution_id: accountsResponse.data.item.institution_id,
                country_codes: [CountryCode.Us]
            } as InstitutionsGetByIdRequest)
            overview.push({
                name: institutionResponse.data.institution.name,
                accounts: accountsResponse.data.accounts.map(account => {
                    return {name: account.name}
                })
            })
        }
        return overview
    }
}