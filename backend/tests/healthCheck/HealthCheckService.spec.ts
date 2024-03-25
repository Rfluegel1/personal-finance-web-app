import HealthCheckService from '../../src/healthCheck/HealthCheckService';
import DataSourceService from '../../src/dataSource/DataSourceService';

// setup
jest.mock('../../src/logger', () => ({
	getLogger: jest.fn(() => {
		return {
			error: jest.fn()
		};
	})
}));
describe('Health check service', () => {
	const healthCheckService: HealthCheckService = new HealthCheckService();
	it('healthcheck calls to repository, and returns happy response',
		async () => {
			// given
			DataSourceService.getInstance().getDataSource().query = jest.fn().mockResolvedValue({});
			// when
			const actual: any = await healthCheckService.healthcheck();
			// then
			expect(DataSourceService.getInstance().getDataSource().query).toBeCalledWith('SELECT 1');
			expect(actual.result).toEqual('success');
			expect(actual.integrations.database.result).toEqual('success');
			expect(actual.integrations.database.details).toEqual('');
		});
	it('healthcheck sets result and database to failure when there is an error thrown',
		async () => {
			// given
			DataSourceService.getInstance().getDataSource().query = jest.fn().mockRejectedValue(new Error('error message'));
			// when
			const actual: any = await healthCheckService.healthcheck();
			// then
			expect(actual.result).toEqual('failure');
			expect(actual.integrations.database.result).toEqual('failure');
			expect(actual.integrations.database.details).toEqual('error message');
		});
});