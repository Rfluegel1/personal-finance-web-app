import {Configuration, PlaidApi, PlaidEnvironments} from 'plaid'

const plaidEnvironment = process.env.NODE_ENV === 'development' ? 'sandbox' : 'development'

const plaidConfiguration = new Configuration({
    basePath: PlaidEnvironments[plaidEnvironment],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': '64fbc6e226a0f70017bcd313',
            'PLAID-SECRET': process.env.PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
})

export const plaidClient = new PlaidApi(plaidConfiguration)