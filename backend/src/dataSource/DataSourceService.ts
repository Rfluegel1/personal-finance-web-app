import { DataSource } from 'typeorm';
import { getLogger } from '../logger';
import { DatabaseException } from '../exceptions/DatabaseException';
import Todo from '../todos/Todo';
import User from '../users/User';

export default class DataSourceService {

	static instance: DataSourceService;
	readonly dataSource: DataSource;

	private constructor() {
		this.dataSource = this.createDataSource();
	}

	static getInstance(): DataSourceService {
		if (!DataSourceService.instance) {
			DataSourceService.instance = new DataSourceService();
		}
		return DataSourceService.instance;
	}

	getDataSource(): DataSource {
		return this.dataSource;
	}

	private createDataSource() {
		return new DataSource({
			type: 'postgres',
			host: process.env.DB_HOSTNAME,
			port: 5432,
			username: process.env.DB_USERNAME,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_DATABASE,
			synchronize: false,
			entities: [
				Todo,
				User
			],
			migrations: [
				'src/migrations/*.ts'
			],
			migrationsRun: true
		});
	}

	async initialize(): Promise<void> {
		await this.executeWithCatch(() => this.dataSource.initialize());
	}

	async destroy(): Promise<void> {
		await this.executeWithCatch(() => this.dataSource.destroy());
	}

	private async executeWithCatch(action: () => Promise<any>): Promise<any> {
		try {
			return await action();
		} catch (error: any) {
			getLogger().error(error.message);
			throw new DatabaseException();
		}
	}
}
