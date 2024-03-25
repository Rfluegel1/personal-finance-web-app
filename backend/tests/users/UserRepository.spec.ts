import UserRepository from '../../src/users/UserRepository';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundException } from '../../src/exceptions/NotFoundException';
import User from '../../src/users/User';

// setup
jest.mock('../../src/logger', () => ({
	getLogger: jest.fn(() => {
		return {
			error: jest.fn()
		};
	})
}));

const repository = new UserRepository();
beforeEach(() => {
	repository.userDataSource.query = jest.fn();
	repository.userRepository.save = jest.fn();
	repository.userRepository.delete = jest.fn();
	repository.userRepository.findOne = jest.fn();
	repository.userRepository.find = jest.fn();
});

describe('User repository', () => {
	let user = new User(
		'the email',
		'the passwordHash',
		false,
		{ token: 'emailVerificationToken', expiration: 'emailVerificationExpiration' },
		'role',
		{ token: 'passwordResetToken', expiration: 'passwordResetExpiration' },
		{ token: 'emailUpdateToken', expiration: 'emailUpdateExpiration' },
		'pendingEmail'
	);

	describe('in regards to normal operations', () => {
		it('getUser selects from userDataSource', async () => {
			//given
			const id = uuidv4();
			user.id = id;
			(repository.userRepository.findOne as jest.Mock).mockImplementation(jest.fn((options) => {
				if (options.where.id === id) {
					return user;
				}
			}));
			// when
			const actual = await repository.getUser(id);
			// then
			expect(actual).toBeInstanceOf(User);
			expect(actual.id).toEqual(id);
			expect(actual.email).toEqual('the email');
			expect(actual.passwordHash).toEqual('the passwordHash');
			expect(actual.isVerified).toEqual(false);
			expect(actual.emailVerification.token).toEqual('emailVerificationToken');
			expect(actual.emailVerification.expiration).toEqual('emailVerificationExpiration');
			expect(actual.emailUpdate.token).toEqual('emailUpdateToken');
			expect(actual.emailUpdate.expiration).toEqual('emailUpdateExpiration');
			expect(actual.passwordReset.token).toEqual('passwordResetToken');
			expect(actual.passwordReset.expiration).toEqual('passwordResetExpiration');
		});
		it('getUserByEmail selects from userDataSource', async () => {
			//given
			const id = uuidv4();
			user.email = 'the email';
			user.id = id;
			(repository.userRepository.findOne as jest.Mock).mockImplementation(jest.fn((options) => {
				if (options.where.email === 'the email') {
					return user;
				}
			}));
			// when
			const actual = await repository.getUserByEmail('the email');
			// then
			expect(actual).toBeInstanceOf(User);
			expect(actual.id).toEqual(id);
		});
		it('getUserByEmailVerificationToken selects from userDataSource', async () => {
			//given
			const id = uuidv4();
			(repository.userDataSource.query as jest.Mock).mockImplementation(jest.fn((query, parameters) => {
				if (query === 'SELECT * FROM users WHERE emailVerification->>\'token\'=$1' && parameters[0] === 'token') {
					return [{
						id: id,
						email: 'the email',
						passwordhash: 'the passwordHash',
						isverified: false,
						emailverification: { token: 'token' }
					}];
				}
			}));
			// when
			const actual = await repository.getUserByEmailVerificationToken('token');
			// then
			expect(actual).toBeInstanceOf(User);
			expect(actual.id).toEqual(id);
			expect(actual.email).toEqual('the email');
			expect(actual.passwordHash).toEqual('the passwordHash');
			expect(actual.isVerified).toEqual(false);
			expect(actual.emailVerification.token).toEqual('token');
		});
		it('getUserByPasswordResetToken selects from userDataSource', async () => {
			//given
			const id = uuidv4();
			(repository.userDataSource.query as jest.Mock).mockImplementation(jest.fn((query, parameters) => {
				if (query === 'SELECT * FROM users WHERE passwordReset->>\'token\'=$1' && parameters[0] === 'token') {
					return [{
						id: id,
						email: 'the email',
						passwordhash: 'the passwordHash',
						isverified: false,
						pendingemail: 'pendingEmail'
					}];
				}
			}));
			// when
			const actual = await repository.getUserByPasswordResetToken('token');
			// then
			expect(actual).toBeInstanceOf(User);
			expect(actual.id).toEqual(id);
			expect(actual.email).toEqual('the email');
			expect(actual.passwordHash).toEqual('the passwordHash');
			expect(actual.isVerified).toEqual(false);
			expect(actual.pendingEmail).toEqual('pendingEmail');
		});
		it('getUserByEmailUpdateToken selects from userDataSource', async () => {
			//given
			const id = uuidv4();
			(repository.userDataSource.query as jest.Mock).mockImplementation(jest.fn((query, parameters) => {
				if (query === 'SELECT * FROM users WHERE emailUpdate->>\'token\'=$1' && parameters[0] === 'token') {
					return [{
						id: id,
						email: 'the email',
						passwordhash: 'the passwordHash',
						isverified: false,
						pendingemail: 'pendingEmail'
					}];
				}
			}));
			// when
			const actual = await repository.getUserByEmailUpdateToken('token');
			// then
			expect(actual).toBeInstanceOf(User);
			expect(actual.id).toEqual(id);
			expect(actual.email).toEqual('the email');
			expect(actual.passwordHash).toEqual('the passwordHash');
			expect(actual.isVerified).toEqual(false);
			expect(actual.pendingEmail).toEqual('pendingEmail');
		});
		it('createUser inserts into userDataSource', async () => {
			// when
			await repository.createUser(user);
			// then
			expect(repository.userRepository.save).toHaveBeenCalledWith(user);
		});
		it('deleteUser deletes from userDataSource', async () => {
			//given
			const id = uuidv4();
			// when
			await repository.deleteUser(id);
			// then
			expect(repository.userRepository.delete).toHaveBeenCalledWith(id);
		});
		it('updateUser updates users in userDataSource', async () => {
			// when
			await repository.updateUser(user);
			// then
			expect(repository.userRepository.save).toHaveBeenCalledWith(user);
		});
	});

	describe('in regards to error handling', () => {
		it('getUser throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userRepository.findOne as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getUser(uuidv4())).rejects.toThrow('Error interacting with the database');
		});
		it('getUserByEmail throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userRepository.findOne as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getUserByEmail('the email')).rejects.toThrow('Error interacting with the database');
		});
		it('getUserByEmailVerificationToken throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userDataSource.query as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getUserByEmailVerificationToken('token')).rejects.toThrow('Error interacting with the database');
		});
		it('getUserByPasswordResetToken throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userDataSource.query as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getUserByPasswordResetToken('token')).rejects.toThrow('Error interacting with the database');
		});
		it('getUserByEmailUpdateToken throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userDataSource.query as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getUserByEmailUpdateToken('token')).rejects.toThrow('Error interacting with the database');
		});
		it('createUser throws database exception', async () => {
			//given
			let error = new Error('DB Error');
			(repository.userRepository.save as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.createUser(new User())).rejects.toThrow('Error interacting with the database');
		});
		it('deleteUser throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userRepository.delete as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.deleteUser(uuidv4())).rejects.toThrow('Error interacting with the database');
		});
		it('updateUser throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.userRepository.save as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.updateUser(new User())).rejects.toThrow('Error interacting with the database');
		});
	});

	describe('in regards to not found exceptions', () => {
		it('getUserByEmail throws not found when query result is empty', async () => {
			//given
			(repository.userRepository.findOne as jest.Mock).mockImplementation(jest.fn(() => {
				return null;
			}));
			// when and then
			await expect(() => repository.getUserByEmail(uuidv4())).rejects.toThrow(NotFoundException);
		});
		it('getUserByEmailVerificationToken throws not found when query result is empty', async () => {
			//given
			(repository.userDataSource.query as jest.Mock).mockImplementation(jest.fn(() => {
				return [];
			}));
			// when and then
			await expect(() => repository.getUserByEmailVerificationToken(uuidv4())).rejects.toThrow(NotFoundException);
		});
		it('getUserByPasswordResetToken throws not found when query result is empty', async () => {
			//given
			(repository.userDataSource.query as jest.Mock).mockImplementation(jest.fn(() => {
				return [];
			}));
			// when and then
			await expect(() => repository.getUserByPasswordResetToken(uuidv4())).rejects.toThrow(NotFoundException);
		});
		it('getUser throws not found when query result is empty', async () => {
			//given
			(repository.userRepository.findOne as jest.Mock).mockImplementation(jest.fn(() => {
				return null;
			}));
			// when and then
			await expect(() => repository.getUser(uuidv4())).rejects.toThrow(NotFoundException);
		});
		it('getUserByEmailUpdateToken throws not found when query result is empty', async () => {
			//given
			(repository.userDataSource.query as jest.Mock).mockImplementation(jest.fn(() => {
				return [];
			}));
			// when and then
			await expect(() => repository.getUserByEmailUpdateToken(uuidv4())).rejects.toThrow(NotFoundException);
		});
	});

	it('createUser throws duplicate row exception', async () => {
		//given
		class CustomError extends Error {
			constraint: string;

			constructor(message: string, constraint: string) {
				super(message);
				this.constraint = constraint;
				this.name = 'CustomError';
			}
		}

		let error = new CustomError('duplicate key value violates unique constraint', 'asdasd');
		(repository.userRepository.save as jest.Mock).mockRejectedValue(error);
		//expect
		await expect(repository.createUser(new User())).rejects.toThrow('Duplicate key value violates unique constraint=asdasd');
	});
});
