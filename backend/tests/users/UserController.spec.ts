import UserController from '../../src/users/UserController';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { NextFunction } from 'express';
import { NotFoundException } from '../../src/exceptions/NotFoundException';
import { BadRequestException } from '../../src/exceptions/BadRequestException';
import { DatabaseException } from '../../src/exceptions/DatabaseException';
import { UnauthorizedException } from '../../src/exceptions/UnauthorizedException';
import { generateTemporaryUserEmail } from '../helpers';
import * as constantsModule from '../../src/utils';
import { validateRequest } from '../../src/utils';

// setup
jest.mock('../../src/users/UserService', () => {
	return jest.fn().mockImplementation(() => {
		return {
			createUser: jest.fn(),
			deleteUser: jest.fn(),
			getUserByEmail: jest.fn(),
			getUser: jest.fn(),
			updateUser: jest.fn()
		};
	});
});

jest.mock('../../src/logger', () => ({
	getLogger: jest.fn(() => {
		return {
			info: jest.fn()
		};
	})
}));

describe('User controller', () => {
	const user = {
		email: 'email',
		passwordHash: 'passwordHash',
		isVerified: false,
		emailVerificationToken: 'emailVerificationToken',
		role: 'role',
		passwordResetToken: 'passwordResetToken'
	};
	const userController = new UserController();
	describe('in regards to normal operation', () => {
		beforeEach(() => {
			jest.spyOn(constantsModule, 'validateRequest').mockImplementation(() => true);
		});

		afterEach(() => {
			jest.clearAllMocks();
			jest.restoreAllMocks();
		});
		it('updateUser should avoid unauthorized and return all fields when called by admin', async () => {
			// given
			let id = uuidv4();
			const mockUser = { id: id, ...user };
			const request = {
				isAuthenticated: () => true,
				user: { id: 'other', role: 'admin' },
				params: { id: id },
				body: {
					email: 'email',
					password: undefined,
					isVerified: true,
					emailVerification: { token: 'emailVerificationToken', expiration: 'emailVerificationExpiration' },
					role: 'role',
					passwordReset: { token: 'passwordResetToken', expiration: 'passwordResetExpiration' },
					emailUpdate: { token: 'emailUpdateToken', expiration: 'emailUpdateExpiration' },
					pendingEmail: 'pendingEmail'
				}
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(userController.userService.updateUser as jest.Mock).mockImplementation(
				(sentId, email, passwordHash, isVerified, emailVerification, role, passwordReset, emailUpdate, pendingEmail) => {
					if (
						sentId === id
						&& email === 'email'
						&& passwordHash === undefined
						&& emailVerification.token === 'emailVerificationToken'
						&& emailVerification.expiration === 'emailVerificationExpiration'
						&& isVerified && role === 'role'
						&& passwordReset.token === 'passwordResetToken'
						&& passwordReset.expiration === 'passwordResetExpiration'
						&& emailUpdate.token === 'emailUpdateToken'
						&& emailUpdate.expiration === 'emailUpdateExpiration'
						&& pendingEmail === 'pendingEmail'
					) {
						return mockUser;
					} else {
						return null;
					}
				}
			);

			// when
			await userController.updateUser(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith(mockUser);
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});

		it('createUser responds with data that is returned from the UserService', async () => {
			// given

			const id = uuidv4();
			const mockUser = { id: id, email: 'email', password: 'password', isVerified: false };
			const request = {
				body: { email: 'email', password: 'password', confirmPassword: 'password' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};

			(userController.userService.createUser as jest.Mock).mockImplementation((email, password) => {
				if (email === 'email' && password === 'password') {
					return mockUser;
				} else {
					return null;
				}
			});

			// when
			await userController.createUser(request as any, response as any, jest.fn());

			// then
			expect(response.send).toHaveBeenCalledWith({ id: id, email: 'email', isVerified: false });
			expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED);
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('getUser responds with data that is returned from the UserService', async () => {
			// given

			let id: string = uuidv4();
			const mockUser = { id: id, ...user };
			const request = {
				params: { id: id },
				isAuthenticated: () => true,
				user: { id: id }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(userController.userService.getUser as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockUser;
				} else {
					return null;
				}
			});

			// when
			await userController.getUser(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith({
				id: mockUser.id,
				email: mockUser.email,
				isVerified: mockUser.isVerified
			});
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('getUserByEmail responds with data that is returned from the UserService', async () => {
			// given

			let id: string = uuidv4();
			const mockUser = { id: id, ...user };
			const request = {
				isAuthenticated: () => true,
				user: { email: user.email },
				query: { email: user.email }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(userController.userService.getUserByEmail as jest.Mock).mockImplementation((email) => {
				if (user.email === email) {
					return mockUser;
				} else {
					return null;
				}
			});

			// when
			await userController.getUserByEmail(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith({
				id: mockUser.id,
				email: mockUser.email,
				isVerified: mockUser.isVerified
			});
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('deleteUser should call service and respond with NO_CONTENT', async () => {
			// given


			let id: string = uuidv4();
			const request = {
				isAuthenticated: () => true,
				user: { id: id },
				params: { id: id }
			};
			const response = {
				sendStatus: jest.fn(function() {
					return this;
				})
			};

			// when
			await userController.deleteUser(request as any, response as any, jest.fn());

			// then
			expect(userController.userService.deleteUser).toHaveBeenCalledWith(id);
			expect(response.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('isVerified should getUser from service and return OK and isVerified', async () => {
			// given
			let id: string = uuidv4();
			const mockUser = { id: id, ...user };
			let request = {
				user: { id: id }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			(userController.userService.getUser as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockUser;
				} else {
					return null;
				}
			});

			// when
			await userController.isVerified(request as any, response as any, jest.fn());

			// then
			expect(response.send).toHaveBeenCalledWith({ isVerified: user.isVerified });
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
		});
	});
	describe('in regards to error handling', () => {
		it('createUser should next error that is returned from the UserService', async () => {
			// given
			const request = {
				body: { task: 'the task' },
				oidc: { user: { sid: 'the createdBy' } }
			};
			const response = {};

			(userController.userService.createUser as jest.Mock).mockImplementation(() => {
				throw new DatabaseException();
			});
			const next: NextFunction = jest.fn();

			// when
			await userController.createUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
		});
		it('updateUser should next error that is returned from the UserService', async () => {
			// given
			let id = uuidv4();
			const request = {
				isAuthenticated: () => true,
				body: { password: 'password', confirmPassword: 'password' },
				user: { id: id, role: 'admin' },
				params: { id: id }
			};
			const response = {};

			(userController.userService.updateUser as jest.Mock).mockImplementation(() => {
				throw new DatabaseException();
			});
			const next: NextFunction = jest.fn();

			// when
			await userController.updateUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
		});
		it('getUser should next error that is returned from the UserService', async () => {
			// given
			let id: string = uuidv4();
			const request = {
				params: { id: id },
				isAuthenticated: () => true,
				user: { id: id }
			};
			const response = {};

			(userController.userService.getUser as jest.Mock).mockImplementation(() => {
				throw new NotFoundException(id);
			});
			const next: NextFunction = jest.fn();

			// when
			await userController.getUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
		});
		it('deleteUser should next error that is returned from the UserService', async () => {
			// given
			let id: string = uuidv4();
			const request = {
				params: { id: id },
				isAuthenticated: () => true,
				user: { id: id }
			};
			const response = {};

			(userController.userService.deleteUser as jest.Mock).mockImplementation(() => {
				throw new DatabaseException();
			});
			const next: NextFunction = jest.fn();

			// when
			await userController.deleteUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
		});
		it('getUserByEmail should next error that is returned from the UserService', async () => {
			// given
			const request = {
				isAuthenticated: () => true,
				user: { email: user.email },
				query: { email: user.email }
			};
			const response = {};

			(userController.userService.getUserByEmail as jest.Mock).mockImplementation(() => {
				throw new NotFoundException(user.email);
			});
			const next: NextFunction = jest.fn();

			// when
			await userController.getUserByEmail(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
		});
	});
	describe('in regards to request format', () => {
		it('updateUser should next error when id is not UUID', async () => {
			// given
			const request = {
				isAuthenticated: () => true,
				user: { id: 'undefined', role: 'admin' },
				params: { id: 'undefined' },
				body: {
					task: 'the user',
					createdBy: undefined
				}
			};
			const response = {};

			const next: NextFunction = jest.fn();

			// when
			await userController.updateUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
		});
		it('deleteUser should next error when id is not UUID', async () => {
			// given
			const request = {
				isAuthenticated: () => true,
				user: { id: 'undefined' },
				params: { id: 'undefined' }
			};
			const response = {};

			const next: NextFunction = jest.fn();

			// when
			await userController.deleteUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
		});
		it('getUser should next error when id is not UUID', async () => {
			// given
			const request = {
				isAuthenticated: () => true,
				params: { id: 'undefined' },
				user: { id: 'undefined' }
			};
			const response = {};

			const next: NextFunction = jest.fn();

			// when
			await userController.getUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
		});
		it('createUser should next Bad Request when password and confirmPassword do no match', async () => {
			// given
			const request = {
				body: { password: 'password', confirmPassword: 'other' }
			};
			const response = {};

			const next: NextFunction = jest.fn();

			// when
			await userController.createUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
		});
		it('updateUser should next Bad Request when password and confirmPassword do no match', async () => {
			// given
			let id = uuidv4();
			const request = {
				body: { password: 'password', confirmPassword: 'other' },
				isAuthenticated: () => true,
				params: { id: id },
				user: { id: id, role: 'admin' }
			};
			const response = {};

			const next: NextFunction = jest.fn();

			// when
			await userController.updateUser(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
		});
	});
	describe('in regards to authentication', () => {
		it.each`
    apiEndpoint              | controllerFunction
    ${'getUser'}             | ${userController.getUser}
    ${'deleteUser'}          | ${userController.deleteUser}
    ${'updateUser'}          | ${userController.updateUser}
    ${'getUserByEmail'}      | ${userController.getUserByEmail}
    `('$apiEndpoint returns unauthorized when the request session is not authenticated', async (
			{ controllerFunction }
		) => {
			const request = {
				user: { id: 'who cares' },
				params: { id: 'who cares' },
				query: { email: 'who cares' },
				isAuthenticated: () => false
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			const next = jest.fn();

			// when
			await controllerFunction(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
		});
		it.each`
    apiEndpoint              | controllerFunction
    ${'getUser'}             | ${userController.getUser}
    ${'deleteUser'}          | ${userController.deleteUser}
    ${'updateUser'}          | ${userController.updateUser}
    `('$apiEndpoint returns unauthorized when auth user id does not match param id', async (
			{ controllerFunction }
		) => {
			const request = {
				isAuthenticated: () => true,
				user: { id: 'user' },
				params: { id: 'other' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			const next = jest.fn();

			// when
			await controllerFunction(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
		});
		it('getUserByEmail returns unauthorized when auth user email does not match query email', async () => {
			// given
			const request = {
				isAuthenticated: () => true,
				user: { email: 'user' },
				query: { email: 'other' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			const next = jest.fn();

			// when
			await userController.getUserByEmail(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
		});
		it('getUser should avoid unauthorized and return all fields when called by admin', async () => {
			// given
			let id: string = uuidv4();
			const mockUser = { id: id, ...user };
			const request = {
				params: { id: id },
				isAuthenticated: () => true,
				user: { id: 'other', role: 'admin' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(userController.userService.getUser as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockUser;
				} else {
					return null;
				}
			});

			// when
			await userController.getUser(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith(mockUser);
		});
		it('getUserByEmail should function normally when called by admin', async () => {
			// given
			let id: string = uuidv4();
			const mockUser = { id: id, ...user };
			const request = {
				isAuthenticated: () => true,
				query: { email: user.email },
				user: { email: 'other', role: 'admin' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(userController.userService.getUserByEmail as jest.Mock).mockImplementation((email) => {
				if (user.email === email) {
					return mockUser;
				} else {
					return null;
				}
			});

			// when
			await userController.getUserByEmail(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith({
				id: mockUser.id,
				email: mockUser.email,
				isVerified: mockUser.isVerified
			});
		});
		it('deleteUser should function normally when called by admin', async () => {
			// given
			let id: string = uuidv4();
			const request = {
				isAuthenticated: () => true,
				user: { id: 'other', role: 'admin' },
				params: { id: id }
			};
			const response = {
				sendStatus: jest.fn(function() {
					return this;
				})
			};
			(userController.userService.deleteUser as jest.Mock).mockImplementation(() => {
				jest.fn();
			});

			// when
			await userController.deleteUser(request as any, response as any, jest.fn());

			// then
			expect(userController.userService.deleteUser).toHaveBeenCalledWith(id);
			expect(response.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
		});
	});
	describe('validateRequest method in todoController', () => {
		const next = jest.fn();
		let longPassword = '';
		for (let i = 0; i < 300; i++) {
			longPassword = longPassword + 'a';
		}

		const testCases = [
			{
				description: 'should throw when id is not uuid',
				input: { params: { id: 'notUuid' } },
				expectThrow: true
			},
			{
				description: 'should not throw when id is uuid',
				input: { params: { id: uuidv4() } },
				expectThrow: false
			},
			{
				description: 'should throw when email is not email',
				input: { body: { email: 'notValidEmail' } },
				expectThrow: true
			},
			{
				description: 'should throw when email contains html',
				input: { body: { email: 'email<script>alert("xss")</script>@test.com' } },
				expectThrow: true
			},
			{
				description: 'should not throw when email is email',
				input: { body: { email: generateTemporaryUserEmail() } },
				expectThrow: false
			},
			{
				description: 'should throw when pendingEmail is not email',
				input: { body: { pendingEmail: 'notValidEmail' } },
				expectThrow: true
			},
			{
				description: 'should throw when pendingEmail contains html',
				input: { body: { pendingEmail: '<script>alert("xss")</script>email@test.com' } },
				expectThrow: true
			},
			{
				description: 'should not throw when pendingEmail is email',
				input: { body: { pendingEmail: generateTemporaryUserEmail() } },
				expectThrow: false
			},
			{
				description: 'should throw when password is not string',
				input: { body: { password: 123 } },
				expectThrow: true
			},
			{
				description: 'should not throw when password is string',
				input: { body: { password: 'password' } },
				expectThrow: false
			},
			{
				description: 'should throw when password is >255',
				input: { body: { password: longPassword } },
				expectThrow: true
			},
			{
				description: 'should throw when password is html',
				input: { body: { password: '<script>alert("xss")</script>' } },
				expectThrow: true
			},
			{
				description: 'should throw when password does not match confirm password',
				input: { body: { password: 'password', confirmPassword: 'password1' } },
				expectThrow: true
			},
			{
				description: 'should not throw when password matches confirm password',
				input: { body: { password: 'password', confirmPassword: 'password' } },
				expectThrow: false
			},
			{
				description: 'should throw when isVerified is not a boolean',
				input: { body: { isVerified: 25 } },
				expectThrow: true
			},
			{
				description: 'should not throw when isVerified is a boolean',
				input: { body: { isVerified: true } },
				expectThrow: false
			},
			{
				description: 'should throw when role is not a string',
				input: { body: { role: true } },
				expectThrow: true
			},
			{
				description: 'should not throw when role is a string',
				input: { body: { role: 'admin' } },
				expectThrow: false
			},
			{
				description: 'should throw when passwordResetToken is not uuid',
				input: { body: { passwordReset: { token: 'notUuid' } } },
				expectThrow: true
			},
			{
				description: 'should not throw when passwordResetToken is uuid',
				input: { body: { passwordReset: { token: uuidv4() } } },
				expectThrow: false
			},
			{
				description: 'should throw when passwordResetToken is not date',
				input: { body: { passwordReset: { expiration: 'notDate' } } },
				expectThrow: true
			},
			{
				description: 'should not throw when passwordResetToken is date',
				input: { body: { passwordReset: { expiration: new Date().toISOString() } } },
				expectThrow: false
			},
			{
				description: 'should throw when emailUpdateToken is not uuid',
				input: { body: { emailUpdate: { token: 'notUuid' } } },
				expectThrow: true
			},
			{
				description: 'should not throw when emailUpdateToken is uuid',
				input: { body: { emailUpdate: { token: uuidv4() } } },
				expectThrow: false
			},
			{
				description: 'should throw when emailUpdateExpiration is not date',
				input: { body: { emailUpdate: { expiration: 'notDate' } } },
				expectThrow: true
			},
			{
				description: 'should not throw when emailUpdateToken is uuid',
				input: { body: { emailUpdate: { expiration: new Date().toISOString() } } },
				expectThrow: false
			},
			{
				description: 'should throw when emailVerificationToken is not uuid',
				input: { body: { emailVerification: { token: 'notUuid' } } },
				expectThrow: true
			},
			{
				description: 'should not throw when emailVerificationToken is uuid',
				input: { body: { emailVerification: { token: uuidv4() } } },
				expectThrow: false
			},
			{
				description: 'should throw when emailVerificationExpiration is not date',
				input: { body: { emailVerification: { expiration: 'notDate' } } },
				expectThrow: true
			},
			{
				description: 'should not throw when emailVerificationExpiration is date',
				input: { body: { emailVerification: { expiration: new Date().toISOString() } } },
				expectThrow: false
			}

		];

		testCases.forEach(({ description, input, expectThrow }) => {
			it(description, () => {
				// when
				validateRequest(input as any, next, userController.validationSchema);

				// then
				if (expectThrow) {
					expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
				} else {
					expect(next).not.toHaveBeenCalledWith(expect.any(BadRequestException));
				}

				// cleanup
				jest.clearAllMocks();
			});
		});
	});
});