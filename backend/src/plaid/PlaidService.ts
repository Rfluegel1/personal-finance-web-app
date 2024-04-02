import {plaidClient} from './PlaidConfiguration'
import {
    CountryCode,
    InstitutionsGetByIdRequest,
    LinkTokenCreateRequest,
    Products, TransactionsGetRequest
} from 'plaid'
import BankService from '../banks/BankService'
import {AxiosResponse} from 'axios'

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
            let transactions: any[] = []
            const transactionsResponse = await this.getTransactionsResponseWithRetry(bank)
            transactions = transactions.concat(transactionsResponse.data.transactions)
            while (transactions.length < transactionsResponse.data.total_transactions) {
                const paginatedTransactionsResponse = await this.getTransactionsResponseWithRetry(bank, transactions.length)
                transactions = transactions.concat(paginatedTransactionsResponse.data.transactions)
            }
            const institutionResponse = await this.getInstitutionsGetById(transactionsResponse)
            overview.push({
                name: institutionResponse.data.institution.name,
                accounts: transactionsResponse.data.accounts.map((account: any) => {
                    return {name: account.name}
                }),
                transactions: transactions.map((transaction: any) => {
                    return {amount: transaction.amount}
                })
            })
        }
        return overview
    }

    async getTransactionsResponseWithRetry(bank: any, offset = 0): Promise<any> {
        try {
            const transactionResponse = await plaidClient.transactionsGet({
                access_token: bank.accessToken,
                start_date: '2022-01-01',
                end_date: '2023-01-01',
                options: {
                    offset: offset
                }
            } as TransactionsGetRequest)
            if (transactionResponse.data?.transactions.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
                return await this.getTransactionsResponseWithRetry(bank)
            }
            return transactionResponse
        } catch (error: any) {
            if (error.response?.data?.error_code === 'PRODUCT_NOT_READY') {
                await new Promise(resolve => setTimeout(resolve, 100))
                return await this.getTransactionsResponseWithRetry(bank)
            } else {
                throw error
            }
        }
    }

    private async getInstitutionsGetById(transactionResponse: AxiosResponse<any, any>) {
        return plaidClient.institutionsGetById({
            institution_id: transactionResponse.data.item.institution_id,
            country_codes: [CountryCode.Us]
        } as InstitutionsGetByIdRequest)
    }
}