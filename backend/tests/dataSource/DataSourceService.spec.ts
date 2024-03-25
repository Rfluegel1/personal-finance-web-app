import DataSourceService from '../../src/dataSource/DataSourceService';

jest.mock('../../src/logger', () => ({
	getLogger: jest.fn(() => {
		return {
			error: jest.fn()
		};
	})
}));

let dataSourceService = DataSourceService.getInstance()
describe('DataSourceService', () => {
	beforeEach(() => {
		dataSourceService.getDataSource().initialize = jest.fn();
		dataSourceService.getDataSource().destroy = jest.fn();
	});
	it('initialize should initialize userDataSource', async () => {
		//when
		await dataSourceService.initialize();
		//then
		expect(dataSourceService.getDataSource().initialize).toHaveBeenCalled();
	});
	it('destroy should destroy dataSource', async () => {
		//when
		await dataSourceService.destroy();
		//then
		expect(dataSourceService.getDataSource().destroy).toHaveBeenCalled();
	});

	it('initialize should throw db error', async () => {
		// given
		let error = new Error('DB Error');
		(dataSourceService.getDataSource().initialize as jest.Mock).mockRejectedValue(error);
		// expect
		await expect(dataSourceService.initialize()).rejects.toThrow('Error interacting with the database');
	});
	it('destroy should throws db error', async () => {
		// given
		let error = new Error('DB Error');
		(dataSourceService.getDataSource().destroy as jest.Mock).mockRejectedValue(error);
		//expect
		await expect(dataSourceService.destroy()).rejects.toThrow('Error interacting with the database');
	});
});