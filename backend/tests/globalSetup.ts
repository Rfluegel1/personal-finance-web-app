import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import globalTeardown from './globalTeardown';
import DataSourceService from '../src/dataSource/DataSourceService';

if (process.env.NODE_ENV === 'test') {
	process.env.NODE_ENV = 'development';
}
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });

export default async () => {
	const startBackend = () => new Promise((resolve) => {
		const server = spawn('./node_modules/.bin/ts-node', ['./src/server.ts']);
		let pid = server.pid?.toString() ? server.pid?.toString() : 'pid undefined';
		console.log('created pid : ', pid);
		fs.writeFileSync(path.join(__dirname, 'server.pid'), pid);
		server.stdout?.on('data', (data) => {
			const output = data.toString();
			if (output.includes('The server is running on port 8090')) {
				resolve(server);
			}
		});
		server.stdout.on('data', (data) => {
		    console.log('stdout:', data.toString());
		});
		server.stderr.on('data', (data) => {
		    console.error('stderr:', data.toString());
		});
	});

	async function createAdmin() {
		try {
			await axios.post(`${process.env.BASE_URL}/api/users`, {
				email: process.env.ADMIN_EMAIL,
				password: process.env.ADMIN_PASSWORD,
				confirmPassword: process.env.ADMIN_PASSWORD
			});
		} catch (error: any) {
			if (error.response.status !== StatusCodes.CONFLICT) {
				await globalTeardown();
				throw error;
			}
		}
		await DataSourceService.getInstance().initialize();
		await DataSourceService.getInstance().getDataSource().query(
			'UPDATE users SET isVerified=$1, role=$2 where email=$3',
			[true, 'admin', process.env.ADMIN_EMAIL]
		);
		await DataSourceService.getInstance().destroy();
	}

	async function createVerifiedTestUser() {
		try {
			await axios.post(`${process.env.BASE_URL}/api/users`, {
				email: 'cypressdefault@gmail.com',
				password: process.env.TEST_USER_PASSWORD,
				confirmPassword: process.env.TEST_USER_PASSWORD
			});
		} catch (error: any) {
			if (error.response.status !== StatusCodes.CONFLICT) {
				await globalTeardown();
				throw error;
			}
		}
		await DataSourceService.getInstance().initialize();
		await DataSourceService.getInstance().getDataSource().query(
			'UPDATE users SET isVerified=$1 where email=$2',
			[true, 'cypressdefault@gmail.com']
		);
		await DataSourceService.getInstance().destroy();
	}

	await startBackend();
	if (process.env.NODE_ENV === 'development') {
		await createAdmin();
		await createVerifiedTestUser()
	}
};
