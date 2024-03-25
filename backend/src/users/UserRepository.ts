import User from './User';
import { NotFoundException } from '../exceptions/NotFoundException';
import { DataSource } from 'typeorm';
import { DatabaseException } from '../exceptions/DatabaseException';
import { getLogger } from '../logger';
import { DuplicateRowException } from '../exceptions/DuplicateRowException';
import DataSourceService from '../dataSource/DataSourceService';

export default class UserRepository {
	userDataSource: DataSource = DataSourceService.getInstance().getDataSource();
	userRepository = DataSourceService.getInstance().getDataSource().getRepository(User);

	async getUser(id: string): Promise<User> {
		const user = await this.executeWithCatch(async () => {
			return await this.userRepository.findOne({ where: { id: id } });
		});
		if (!user) {
			throw new NotFoundException(id);
		}
		return user;
	}

	async getUserByEmail(email: string): Promise<User> {
		const user = await this.executeWithCatch(async () => {
			return await this.userRepository.findOne({ where: { email: email } });
		});
		if (!user) {
			throw new NotFoundException(email);
		}
		return user;
	}

	async getUserByEmailVerificationToken(token: string): Promise<User> {
		const result = await this.executeWithCatch(async () => {
			const queryResult = await this.userDataSource.query(
				"SELECT * FROM users WHERE emailVerification->>'token'=$1" , [token]
			);
			if (queryResult.length === 0) {
				return null;
			}
			return new User().userMapper(queryResult[0]);
		});

		if (result === null) {
			throw new NotFoundException(token);
		}
		return result;
	}

	async getUserByPasswordResetToken(token: string) {
		const result = await this.executeWithCatch(async () => {
			const queryResult = await this.userDataSource.query(
				"SELECT * FROM users WHERE passwordReset->>'token'=$1", [token]
			);
			if (queryResult.length === 0) {
				return null;
			}
			return new User().userMapper(queryResult[0]);
		});

		if (result === null) {
			throw new NotFoundException(token);
		}
		return result;
	}

	async getUserByEmailUpdateToken(token: string) {
		const result = await this.executeWithCatch(async () => {
			const queryResult = await this.userDataSource.query(
				"SELECT * FROM users WHERE emailUpdate->>'token'=$1", [token]
			);
			if (queryResult.length === 0) {
				return null;
			}
			return new User().userMapper(queryResult[0]);
		});

		if (result === null) {
			throw new NotFoundException(token);
		}
		return result;
	}

	async createUser(user: User): Promise<void> {
		await this.executeWithCatch(async () => {
			await this.userRepository.save(user);
		});
	}

	async deleteUser(id: string): Promise<void> {
		await this.executeWithCatch(async () => {
			await this.userRepository.delete(id);
		});
	}

	async updateUser(user: User): Promise<void> {
		await this.executeWithCatch(async () => {
			await this.userRepository.save(user);
		});
	}

	async executeWithCatch(action: () => Promise<any>): Promise<any> {
		try {
			return await action();
		} catch (error: any) {
			getLogger().error(error);
			if (error.message.includes('duplicate key value violates unique constraint') && 'constraint' in error) {
				throw new DuplicateRowException(error.constraint);
			}
			throw new DatabaseException();
		}
	}
}