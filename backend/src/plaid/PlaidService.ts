import {plaidClient} from './PlaidConfiguration'
import {CountryCode, InstitutionsGetByIdRequest, LinkTokenCreateRequest, Products, TransactionsGetRequest} from 'plaid'
import BankService from '../banks/BankService'
import {getTodaysDateInYYYYMMDD, getTwoYearsPreviousTodaysDateInYYYYMMDD} from '../utils'
import {AxiosResponse} from 'axios'

export default class PlaidService {
    bankService = new BankService()

    async exchangeTokenAndUpdateBank(publicToken: string, bankId: string): Promise<any> {
        let response = await plaidClient.itemPublicTokenExchange({
            'public_token': publicToken
        })
        await this.bankService.updateBank(bankId, response.data.access_token, undefined, undefined)
        return {bankId: bankId}
    }

    async createLinkToken(userId: string): Promise<any> {
        const plaidRequest: LinkTokenCreateRequest = {
            'client_name': 'personal-finance-web-app',
            'country_codes': [CountryCode.Us],
            'language': 'en',
            'user': {
                'client_user_id': userId
            },
            'products': [Products.Transactions],
            'required_if_supported_products': [Products.Investments, Products.Liabilities],
        }
        let response = await plaidClient.linkTokenCreate(plaidRequest)
        return {link_token: response.data.link_token}
    }

    async createUpdateLinkToken(userId: string, itemId: string): Promise<any> {
        const accessToken = (await this.bankService.getBankByItemId(itemId)).accessToken

        const plaidRequest: LinkTokenCreateRequest = {
            'client_name': 'personal-finance-web-app',
            'country_codes': [CountryCode.Us],
            'language': 'en',
            'user': {
                'client_user_id': userId
            },
            'products': [Products.Transactions],
            'required_if_supported_products': [Products.Investments, Products.Liabilities],
            'access_token': accessToken,
        }
        let response = await plaidClient.linkTokenCreate(plaidRequest)
        return {link_token: response.data.link_token}
    }

    async exchangeTokenAndSaveBank(publicToken: string, userId: string): Promise<any> {
        let response = await plaidClient.itemPublicTokenExchange({
            'public_token': publicToken
        })
        let bankId = (await this.bankService.createBank(response.data.access_token, userId, response.data.item_id)).id
        return {bankId: bankId}
    }

    async getOverview(userId: string): Promise<any> {
        let overview: { banks: any[], netWorths: any[] } = {banks: [], netWorths: []}
        await this.getBanksAndBuildOverview(userId, overview)
        if (overview.banks.length > 0 && overview.banks.every(bank => bank.error !== 'ITEM_LOGIN_REQUIRED')) {
            this.getNetWorths(overview)
        }
        return overview
    }

    private async getBanksAndBuildOverview(userId: string, overview: { banks: any[]; netWorths: any[] }) {
        const banks = await this.bankService.getBanksByOwner(userId)
        for (let bank of banks) {
            const {institutionName, institutionProducts} = await this.getInstitutionNameAndProducts(bank.accessToken)
            let transactions = []
            let accounts = []
            try {
                const response = await this.getTransactionsAndAccounts(bank)
                transactions = response.transactions
                accounts = response.accounts
                let investmentTransactions: any[] = []
                if (institutionProducts.includes(Products.Investments)) {
                    const investmentTransactionsResponse = await this.getInvestmentTransactionsResponseWithRetry(bank)
                    investmentTransactions = investmentTransactionsResponse.data.investment_transactions
                    while (investmentTransactions.length < investmentTransactionsResponse.data.total_investment_transactions) {
                        const investmentTransactionsResponse = await this.getInvestmentTransactionsResponseWithRetry(bank, investmentTransactions.length)
                        investmentTransactions = investmentTransactions.concat(investmentTransactionsResponse.data.investment_transactions)
                    }
                }
                transactions = transactions.concat(investmentTransactions)
            } catch (error: any) {
                if (error.message === 'ITEM_LOGIN_REQUIRED') {
                    overview.banks.push({
                        name: institutionName,
                        itemId: bank.itemId,
                        id: bank.id,
                        accounts: [],
                        error: 'ITEM_LOGIN_REQUIRED'
                    })
                    continue
                } else {
                    throw error
                }
            }
            const accountsToTransactions = this.matchAccountToTransactions(accounts, transactions)
            this.buildOverview(overview, institutionName, bank, accounts, accountsToTransactions)
        }
    }

    private buildOverview(overview: {
        banks: any[];
        netWorths: any[]
    }, institutionName: string, bank: any, accounts: any[], accountsToTransactions: Map<any, any>) {
        overview.banks.push({
            name: institutionName,
            id: bank.id,
            itemId: bank.itemId,
            accounts: accounts.map((account) => {
                return {
                    name: account.name,
                    type: account.type,
                    balances: {current: account.balances.current},
                    transactions: accountsToTransactions.get(account.account_id)
                }
            })
        })
    }

    private getNetWorths(overview: { banks: any[]; netWorths: any[] }) {
        let todaysNetWorth = this.getTodaysNetWorth(overview)
        let netWorthOverTime = this.getPenultimateAndPreviousNetWorths(overview, todaysNetWorth)
        overview.netWorths = netWorthOverTime.concat({
            date: getTodaysDateInYYYYMMDD(),
            epochTimestamp: new Date(getTodaysDateInYYYYMMDD() + 'T00:00:00Z').getTime(),
            value: todaysNetWorth
        })
    }

    private getPenultimateAndPreviousNetWorths(overview: { banks: any[]; netWorths: any[] }, todaysNetWorth: number) {
        let allTransactions: any[] = []
        overview.banks.forEach(bank => {
            bank.accounts.forEach((account: any) => {
                const transactions = account.transactions.map((transaction: any) => ({
                    ...transaction,
                    accountType: account.type
                }))
                allTransactions = allTransactions.concat(transactions)
            })
        })
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        let netWorthOverTime: any[] = []
        let currentNetWorth = todaysNetWorth
        allTransactions.forEach(transaction => {
            if (['depository', 'investment'].includes(transaction.accountType)) {
                currentNetWorth += transaction.amount
            } else {
                currentNetWorth -= transaction.amount
            }
            if (netWorthOverTime.length > 0 && netWorthOverTime[netWorthOverTime.length - 1].date === transaction.date) {
                netWorthOverTime[netWorthOverTime.length - 1].value = currentNetWorth
            } else {
                netWorthOverTime.push({
                    date: transaction.date,
                    epochTimestamp: new Date(transaction.date + 'T00:00:00Z').getTime(),
                    value: currentNetWorth
                })
            }
        })
        netWorthOverTime.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        return netWorthOverTime
    }

    private getTodaysNetWorth(overview: { banks: any[]; netWorths: any[] }) {
        let todaysNetWorth = 0
        let accounts = overview.banks.flatMap((bank: { name: string, accounts: any }) => bank.accounts)
        for (let account of accounts) {
            if (['depository', 'investment'].includes(account.type)) {
                todaysNetWorth += account.balances.current
            } else {
                todaysNetWorth -= account.balances.current
            }
        }
        return todaysNetWorth
    }

    private matchAccountToTransactions(accounts: any[], transactions: any[]) {
        let accountsMap = new Map<string, any>
        for (let account of accounts) {
            accountsMap.set(account.account_id, [])
        }
        for (let transaction of transactions) {
            accountsMap.get(transaction.account_id).push({
                amount: transaction.amount,
                date: transaction.date
            })
        }
        return accountsMap
    }

    private async getInstitutionNameAndProducts(accessToken: string) {
        const itemResponse = await plaidClient.itemGet({
            access_token: accessToken
        })
        if (!itemResponse.data.item.institution_id) {
            throw new Error('Institution ID not found')
        }
        const institutionId = itemResponse.data.item.institution_id
        const institutionResponse = await this.getInstitutionsGetById(institutionId)
        return {
            institutionName: institutionResponse.data.institution.name,
            institutionProducts: institutionResponse.data.institution.products
        }
    }

    private async getTransactionsAndAccounts(bank: any) {
        let transactions: any[] = []
        let accounts: any[]
        const transactionsResponse = await this.getTransactionsResponseWithRetry(bank)
        accounts = transactionsResponse.data.accounts
        transactions = transactions.concat(transactionsResponse.data.transactions)
        while (transactions.length < transactionsResponse.data.total_transactions) {
            const paginatedTransactionsResponse = await this.getTransactionsResponseWithRetry(bank, transactions.length)
            transactions = transactions.concat(paginatedTransactionsResponse.data.transactions)
        }
        return {transactions, accounts}
    }

    async getTransactionsResponseWithRetry(bank: any, offset = 0): Promise<any> {
        let apiCall = () => this.getTransactions(bank, offset)
        let recursiveCall = () => this.getTransactionsResponseWithRetry(bank)
        return await this.callWithRetry(apiCall, recursiveCall)
    }

    private async callWithRetry(apiCall: () => Promise<AxiosResponse<any, any>>, recursiveCall: () => Promise<any>) {
        try {
            return await apiCall()
        } catch (error: any) {
            if (error.response?.data?.error_code === 'PRODUCT_NOT_READY') {
                await new Promise(resolve => setTimeout(resolve, 100))
                return await recursiveCall()
            } else if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
                throw new Error('ITEM_LOGIN_REQUIRED')
            } else {
                throw error
            }
        }
    }

    async getInvestmentTransactionsResponseWithRetry(bank: any, offset = 0): Promise<any> {
        const apiCall = () => this.getInvestmentTransactions(bank, offset)
        const recursiveCall = () => this.getInvestmentTransactionsResponseWithRetry(bank)
        return await this.callWithRetry(apiCall, recursiveCall)
    }

    private async getInvestmentTransactions(bank: any, offset: number) {
        return await plaidClient.investmentsTransactionsGet({
            access_token: bank.accessToken,
            start_date: getTwoYearsPreviousTodaysDateInYYYYMMDD(),
            end_date: getTodaysDateInYYYYMMDD(),
            options: {
                offset: offset,
                count: 500
            }
        })
    }

    private async getTransactions(bank: any, offset: number) {
        return await plaidClient.transactionsGet({
            access_token: bank.accessToken,
            start_date: getTwoYearsPreviousTodaysDateInYYYYMMDD(),
            end_date: getTodaysDateInYYYYMMDD(),
            options: {
                offset: offset,
                count: 500
            }
        } as TransactionsGetRequest)
    }

    private async getInstitutionsGetById(institutionId: string) {
        return plaidClient.institutionsGetById({
            institution_id: institutionId,
            country_codes: [CountryCode.Us]
        } as InstitutionsGetByIdRequest)
    }
}