import UserService from '../../src/users/UserService';
import { v4 as uuidv4 } from 'uuid';
import { UUID_REG_EXP } from '../../src/utils';
import User from '../../src/users/User';

// setup
jest.mock('../../src/users/UserRepository', () => {
	return jest.fn().mockImplementation(() => {
		return {
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			getUser: jest.fn(),
			getUserByEmail: jest.fn(),
			updateUser: jest.fn()
		};
	});
});
jest.mock('bcrypt', () => ({
	hash: jest.fn().mockResolvedValue('passwordHash')
}));
jest.mock('../../src/verification/VerificationService', () => {
	return jest.fn().mockImplementation(() => {
		return {
			sendVerificationEmail: jest.fn()
		};
	});
});


describe('User service', () => {
	let user = { email: 'email', passwordHash: 'passwordHash' };
	let service: UserService = new UserService();
	it('createUser should call repository and returns User', async () => {
		const expectedUser = user;
		// when
		let result: User = await service.createUser('email', 'password');
		// then
		expect(service.userRepository.createUser).toHaveBeenCalledWith(expect.objectContaining(expectedUser));
		expect(service.verificationService.sendVerificationEmail).toHaveBeenCalledWith(result.id);
		expect(result.email).toEqual('email');
		expect(result.passwordHash).toEqual('passwordHash');
		expect(result.id).toMatch(UUID_REG_EXP);
	});
	it('getUser returns users from repository', async () => {
		//given
		const id: string = uuidv4();
		const mockUser = { id: id, ...user };

		(service.userRepository.getUser as jest.Mock).mockImplementation((sentId: string) => {
			if (sentId === id) {
				return mockUser;
			}
		});
		// when
		const result: User = await service.getUser(id);
		// then
		expect(result.email).toEqual('email');
		expect(result.passwordHash).toEqual('passwordHash');
		expect(result.id).toEqual(id);
	});
	it('getUserByEmail returns users from repository', async () => {
		//given
		const id: string = uuidv4();
		const mockUser = { id: id, ...user };

		(service.userRepository.getUserByEmail as jest.Mock).mockImplementation((email: string) => {
			if (email === user.email) {
				return mockUser;
			}
		});
		// when
		const result: User = await service.getUserByEmail(user.email);
		// then
		expect(result.email).toEqual('email');
		expect(result.passwordHash).toEqual('passwordHash');
		expect(result.id).toEqual(id);
	});
	it('delete calls to repo', async () => {
		//given
		const id: string = uuidv4();
		// when
		await service.deleteUser(id);
		// then
		expect(service.userRepository.deleteUser).toHaveBeenCalledWith(id);
	});
	it('updateUser gets from repository, calls repository to update, and returns User', async () => {
		//given
		const id: string = uuidv4();
		const expectedUser = {
			email: 'email',
			passwordHash: 'passwordHash',
			isVerified: true,
			emailVerification: { token: 'emailVerificationToken', expiration: 'emailVerificationExpiration' },
			role: 'role',
			passwordReset: {token: 'passwordResetToken', expiration: 'passwordResetExpiration' },
			emailUpdate: {token: 'emailUpdateToken', expiration: 'emailUpdateExpiration'},
			pendingEmail: 'pendingEmail'
		};
		(service.userRepository.getUser as jest.Mock).mockImplementation(jest.fn(() => {
			let user = new User();
			user.id = id;
			return user;
		}));
		// when
		let result: User = await service.updateUser(id, 'email', 'password', true, {
			token: 'emailVerificationToken',
			expiration: 'emailVerificationExpiration'
		}, 'role', {token: 'passwordResetToken', expiration: 'passwordResetExpiration' }, {token: 'emailUpdateToken', expiration: 'emailUpdateExpiration'}, 'pendingEmail');
		// then
		expect(service.userRepository.updateUser).toHaveBeenCalledWith(expect.objectContaining(expectedUser));
		expect(result.email).toEqual('email');
		expect(result.passwordHash).toEqual('passwordHash');
		expect(result.id).toEqual(id);
		expect(result.isVerified).toEqual(true);
		expect(result.emailVerification.token).toEqual('emailVerificationToken');
		expect(result.emailVerification.expiration).toEqual('emailVerificationExpiration');
		expect(result.role).toEqual('role');
		expect(result.emailUpdate.token).toEqual('emailUpdateToken');
		expect(result.emailUpdate.expiration).toEqual('emailUpdateExpiration');
		expect(result.passwordReset.token).toEqual('passwordResetToken');
		expect(result.passwordReset.expiration).toEqual('passwordResetExpiration');
		expect(result.pendingEmail).toEqual('pendingEmail');
	});
	it.each`
    email          | password      | isVerified    | emailVerificationToken         | emailVerificationExpiration          | role          | passwordResetToken     | passwordResetExpiration     | emailUpdateToken     | emailUpdateExpiration     | pendingEmail          | expected
    ${undefined}   | ${undefined}  | ${undefined}  | ${undefined}                   | ${undefined}                         | ${undefined}  | ${undefined}           | ${undefined}                    | ${undefined}         | ${undefined}                    | ${undefined}          | ${{
		email: 'old email',
		passwordHash: 'old passwordHash',
		isVerified: false,
		emailVerification: { token: 'old emailVerificationToken', expiration: 'old emailVerificationExpiration' },
		role: 'old role',
		emailUpdate: { token: 'old emailUpdateToken', expiration: 'old emailUpdateExpiration' },
		passwordReset: { token: 'old passwordResetToken', expiration: 'old passwordResetExpiration' },
		pendingEmail: 'old pendingEmail'
	}}
    ${'new email'} | ${'password'} | ${true}       | ${'new emailVerificationToken'}| ${'new emailVerificationExpiration'} | ${'new role'} | ${'new passwordResetToken'} | ${'new passwordResetExpiration'}|  ${'new emailUpdateToken'} | ${'new emailUpdateExpiration'}| ${'new pendingEmail'} | ${{
		email: 'new email',
		passwordHash: 'passwordHash',
		isVerified: true,
		emailVerification: { token: 'new emailVerificationToken', expiration: 'new emailVerificationExpiration' },
		role: 'new role',
		emailUpdate: { token: 'new emailUpdateToken', expiration: 'new emailUpdateExpiration' },
		passwordReset: { token: 'new passwordResetToken', expiration: 'new passwordResetExpiration' },
		pendingEmail: 'new pendingEmail'
	}}
    `('updateUser only sets defined fields on updated User',
		async ({
						 email,
						 password,
						 isVerified,
						 emailVerificationToken,
						 emailVerificationExpiration,
						 role,
						 passwordResetToken,
						 passwordResetExpiration,
						 emailUpdateToken,
						 emailUpdateExpiration,
						 pendingEmail,
						 expected
					 }) => {
			//given
			const existingUser = new User('old email', 'old passwordHash', false, {
				token: 'old emailVerificationToken',
				expiration: 'old emailVerificationExpiration'
			}, 'old role', {
				token: 'old passwordResetToken',
				expiration: 'old passwordResetExpiration'
			}, {
				token: 'old emailUpdateToken',
				expiration: 'old emailUpdateExpiration'
			}, 'old pendingEmail');
			(service.userRepository.getUser as jest.Mock).mockImplementation((sentId: string) => {
				if (sentId === existingUser.id) {
					return existingUser;
				}
			});
			// when
			let result: User = await service.updateUser(existingUser.id, email, password, isVerified, {
				token: emailVerificationToken,
				expiration: emailVerificationExpiration
			}, role,  {
				token: passwordResetToken,
				expiration: passwordResetExpiration
			}, {
				token: emailUpdateToken,
				expiration: emailUpdateExpiration
			}, pendingEmail);
			// then
			expect(service.userRepository.updateUser).toHaveBeenCalledWith(expect.objectContaining(expected));
			expect(result.email).toEqual(expected.email);
			expect(result.passwordHash).toEqual(expected.passwordHash);
			expect(result.id).toEqual(existingUser.id);
			expect(result.isVerified).toEqual(expected.isVerified);
			expect(result.emailVerification.token).toEqual(expected.emailVerification.token);
			expect(result.emailVerification.expiration).toEqual(expected.emailVerification.expiration);
			expect(result.role).toEqual(expected.role);
			expect(result.passwordReset.token).toEqual(expected.passwordReset.token);
			expect(result.passwordReset.expiration).toEqual(expected.passwordReset.expiration);
			expect(result.emailUpdate.token).toEqual(expected.emailUpdate.token);
			expect(result.emailUpdate.expiration).toEqual(expected.emailUpdate.expiration);
			expect(result.pendingEmail).toEqual(expected.pendingEmail);
		});

	it('updateUser handles undefined nested fields', async () => {
		//given
		const id: string = uuidv4();
		const expectedUser = {
			email: 'email',
			passwordHash: 'passwordHash',
			isVerified: true,
			emailVerification: { token: '', expiration: '' },
			role: 'role',
			passwordReset: { token: '', expiration: '' },
			emailUpdate: { token: '', expiration: '' },
			pendingEmail: 'pendingEmail'
		};
		(service.userRepository.getUser as jest.Mock).mockImplementation(jest.fn(() => {
			let user = new User();
			user.id = id;
			return user;
		}));
		// when
		await service.updateUser(id, 'email', 'password', true, undefined, 'role', undefined,undefined, 'pendingEmail');
		// then
		expect(service.userRepository.updateUser).toHaveBeenCalledWith(expect.objectContaining(expectedUser));
	});
});
