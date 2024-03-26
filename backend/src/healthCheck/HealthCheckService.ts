import {getLogger} from '../logger'
import DataSourceService from '../dataSource/DataSourceService'
import axios from 'axios'

export default class HealthCheckService {
    async healthcheck() {
        let response = {
            'result': 'success',
            'integrations': {
                'database': {
                    'result': 'success',
                    'details': ''
                },
                'plaid': {
                    'result': 'success',
                    'details': ''
                }
            }
        }
        try {
            await DataSourceService.getInstance().getDataSource().query('SELECT 1')
        } catch (error: any) {
            getLogger().error('Healthcheck for datasource failed!', error)
            response.result = 'failure'
            response.integrations.database.result = 'failure'
            response.integrations.database.details = error.message
        }
        try {
            const response = await axios.post(`${process.env.PLAID_URL}/link/token/create`, {
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
            if (response.status !== 200) {
                throw new Error('Plaid returned status code=' + response.status)
            }
        } catch (error: any) {
            getLogger().error('Healthcheck for plaid failed!', error)
            response.result = 'failure'
            response.integrations.database.result = 'failure'
            response.integrations.database.details = error.message
        }
        return response
    }
}