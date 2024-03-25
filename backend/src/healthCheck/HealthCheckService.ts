import {getLogger} from '../logger'
import DataSourceService from '../dataSource/DataSourceService';

export default class HealthCheckService {
    async healthcheck() {
        let response = {
            'result': 'success',
            'integrations': {
                'database': {
                    'result': 'success',
                    'details': ''
                },
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
        return response
    }
}