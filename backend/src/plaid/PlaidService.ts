import axios from 'axios'

export default class PlaidService {
    async createLinkToken(): Promise<any> {
        let response

        response = await axios.post(`${process.env.PLAID_URL}/link/token/create`, {
            'client_id': '64fbc6e226a0f70017bcd313',
            'secret': process.env.PLAID_SECRET,
            'client_name': 'personal-finance-web-app',
            'country_codes': ['US'],
            'language': 'en',
            'user': {
                'client_user_id': 'health-check'
            },
            'products': ['transactions']
        })
        return {link_token: response.data.link_token}
    }
}