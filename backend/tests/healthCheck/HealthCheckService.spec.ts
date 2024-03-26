import HealthCheckService from '../../src/healthCheck/HealthCheckService'
import DataSourceService from '../../src/dataSource/DataSourceService'
import axios from 'axios'

// setup
jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            error: jest.fn()
        }
    })
}))
describe('Health check service', () => {
    const healthCheckService: HealthCheckService = new HealthCheckService()
    it('healthcheck calls to repository, and returns happy response',
        async () => {
            // given
            axios.post = jest.fn().mockResolvedValue({status: 200})
            DataSourceService.getInstance().getDataSource().query = jest.fn().mockResolvedValue({})
            // when
            const actual: any = await healthCheckService.healthcheck()
            // then
            expect(DataSourceService.getInstance().getDataSource().query).toHaveBeenCalledWith('SELECT 1')
            expect(actual.result).toEqual('success')
            expect(actual.integrations.database.result).toEqual('success')
            expect(actual.integrations.database.details).toEqual('')
        })
    it('healthcheck sets result and database to failure when there is an error thrown',
        async () => {
            // given
            axios.post = jest.fn().mockResolvedValue({status: 200})
            DataSourceService.getInstance().getDataSource().query = jest.fn().mockRejectedValue(new Error('error message'))
            // when
            const actual: any = await healthCheckService.healthcheck()
            // then
            expect(actual.result).toEqual('failure')
            expect(actual.integrations.database.result).toEqual('failure')
            expect(actual.integrations.database.details).toEqual('error message')
        })
    it('healthcheck calls to plaid, and returns happy response',
        async () => {
            // given
            DataSourceService.getInstance().getDataSource().query = jest.fn().mockResolvedValue({})
            axios.post = jest.fn().mockResolvedValue({status: 200})
            // when
            const actual: any = await healthCheckService.healthcheck()
            // then
            expect(axios.post).toHaveBeenCalledWith('https://sandbox.plaid.com/link/token/create', {
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
            expect(actual.result).toEqual('success')
            expect(actual.integrations.plaid.result).toEqual('success')
            expect(actual.integrations.plaid.details).toEqual('')
        })
    it('healthcheck sets result and plaid to failure when there is an error thrown',
        async () => {
            // given
            axios.post = jest.fn().mockResolvedValue({status: 201})
            // when
            const actual: any = await healthCheckService.healthcheck()
            // then
            expect(actual.result).toEqual('failure')
            expect(actual.integrations.database.result).toEqual('failure')
            expect(actual.integrations.database.details).toEqual('Plaid returned status code=500')
        })
})