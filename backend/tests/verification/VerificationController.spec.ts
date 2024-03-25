import VerificationController from '../../src/verification/VerificationController';
import { StatusCodes } from 'http-status-codes';
import { DatabaseException } from '../../src/exceptions/DatabaseException';
import { NextFunction } from 'express';
import { UnauthorizedException } from '../../src/exceptions/UnauthorizedException';
import { BadRequestException } from '../../src/exceptions/BadRequestException';
import { v4 } from 'uuid';
import { generateTemporaryUserEmail } from '../helpers';
import * as constantsModule from '../../src/utils';
import { validateRequest } from '../../src/utils';

jest.mock('../../src/verification/VerificationService', () => {
	return jest.fn().mockImplementation(() => {
		return {
			sendVerificationEmail: jest.fn(),
			verifyEmail: jest.fn(),
			requestPasswordReset: jest.fn(),
			resetPassword: jest.fn(),
			requestEmailChange: jest.fn(),
			updateEmail: jest.fn()
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
describe('Verification controller', () => {
	type VerificationMethodName =
		'verifyEmail'
		| 'sendVerificationEmail'
		| 'requestEmailChange'
		| 'requestPasswordReset'
		| 'resetPassword'
		| 'updateEmail';

	let verificationController = new VerificationController();

	describe('VerificationController success responses', () => {
		const mockRequest = {
			isAuthenticated: jest.fn(),
			user: { id: '123' },
			body: { email: 'email@example.com', password: 'password', confirmPassword: 'password' },
			query: { token: '123' }
		};
		const mockResponse = () => ({
			status: jest.fn().mockReturnThis(),
			send: jest.fn()
		});
		const nextFunction = jest.fn();

		interface SuccessTestCase {
			name: VerificationMethodName;
			setup: () => void;
			request: any;
			expectedStatus: number;
		}

		const successTestCases: SuccessTestCase[] = [
			{
				name: 'sendVerificationEmail',
				setup: () => jest.spyOn(verificationController.verificationService, 'sendVerificationEmail').mockImplementation(async () => {
				}),
				request: { ...mockRequest, isAuthenticated: () => true },
				expectedStatus: StatusCodes.CREATED
			},
			{
				name: 'requestPasswordReset',
				setup: () => jest.spyOn(verificationController.verificationService, 'requestPasswordReset').mockImplementation(async () => {
				}),
				request: { body: { email: 'email@example.com' } },
				expectedStatus: StatusCodes.CREATED
			},
			{
				name: 'requestEmailChange',
				setup: () => jest.spyOn(verificationController.verificationService, 'requestEmailChange').mockImplementation(async () => {
				}),
				request: { ...mockRequest, isAuthenticated: () => true, body: { email: 'newEmail@example.com' } },
				expectedStatus: StatusCodes.CREATED
			},
			{
				name: 'verifyEmail',
				setup: () => jest.spyOn(verificationController.verificationService, 'verifyEmail').mockImplementation(async () => {
				}),
				request: { query: { token: '123' } },
				expectedStatus: StatusCodes.OK
			},
			{
				name: 'resetPassword',
				setup: () => jest.spyOn(verificationController.verificationService, 'resetPassword').mockImplementation(async () => {
				}),
				request: { ...mockRequest, query: { token: '123' } },
				expectedStatus: StatusCodes.OK
			},
			{
				name: 'updateEmail',
				setup: () => jest.spyOn(verificationController.verificationService, 'updateEmail').mockImplementation(async () => {
				}),
				request: { query: { token: '123' } },
				expectedStatus: StatusCodes.OK
			}
		];

		successTestCases.forEach(({ name, setup, request, expectedStatus }) => {
			it(`${name} should respond with ${expectedStatus} when service is successful`, async () => {
				// Given
				jest.spyOn(constantsModule, 'validateRequest').mockImplementation(() => true);

				setup();
				const res = mockResponse();

				// When
				await verificationController[name](request as any, res as any, nextFunction);

				// Then
				expect(res.status).toHaveBeenCalledWith(expectedStatus);
				expect(constantsModule.validateRequest).toHaveBeenCalled();

				// cleanup
				jest.clearAllMocks();
				jest.restoreAllMocks();
			});
		});
	});
	describe('VerificationController error handling', () => {
		const mockResponse = () => ({
			status: jest.fn().mockReturnThis(),
			send: jest.fn()
		});
		const next = jest.fn();

		interface ErrorTestCase {
			name: VerificationMethodName;
			setup: (controller: VerificationController) => void;
			request: any;
		}

		const testCases: ErrorTestCase[] = [
			{
				name: 'verifyEmail',
				setup: (controller: VerificationController) => jest.spyOn(controller.verificationService, 'verifyEmail').mockImplementation(() => {
					throw new DatabaseException();
				}),
				request: { query: { token: v4() } }
			},
			{
				name: 'sendVerificationEmail',
				setup: (controller: VerificationController) => jest.spyOn(controller.verificationService, 'sendVerificationEmail').mockImplementation(() => {
					throw new DatabaseException();
				}),
				request: { isAuthenticated: () => true, user: { id: '123' } }
			},
			{
				name: 'requestEmailChange',
				setup: (controller: VerificationController) => jest.spyOn(controller.verificationService, 'requestEmailChange').mockImplementation(() => {
					throw new DatabaseException();
				}),
				request: { isAuthenticated: () => true, user: { id: '123' }, body: { email: 'newEmail@example.com' } }
			},
			{
				name: 'requestPasswordReset',
				setup: (controller: VerificationController) => jest.spyOn(controller.verificationService, 'requestPasswordReset').mockImplementation(() => {
					throw new DatabaseException();
				}),
				request: { body: { email: 'email@example.com' } }
			},
			{
				name: 'resetPassword',
				setup: (controller: VerificationController) => {
					jest.spyOn(controller.verificationService, 'resetPassword').mockImplementation(() => {
						throw new DatabaseException();
					});
				},
				request: { query: { token: '123' }, body: { password: 'password', confirmPassword: 'password' } }
			},
			{
				name: 'updateEmail',
				setup: (controller: VerificationController) => jest.spyOn(controller.verificationService, 'updateEmail').mockImplementation(() => {
					throw new DatabaseException();
				}),
				request: { query: { token: v4() } }
			}
		];

		testCases.forEach(({ name, setup, request }) => {
			it(`${name} should next any error thrown from service`, async () => {
				// Given
				const response = mockResponse();
				setup(verificationController);

				// When
				await verificationController[name](request as any, response as any, next);

				// Then
				expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));

				// Cleanup - Restore original implementations if necessary
				jest.restoreAllMocks();
			});
		});
	});
	describe('VerificationController unauthorized access handling', () => {
		const verificationController = new VerificationController();
		const nextFunction: NextFunction = jest.fn();

		interface UnauthorizedTestCase {
			name: VerificationMethodName;
		}

		// Array of unauthorized test cases
		const unauthorizedTestCases: UnauthorizedTestCase[] = [
			{
				name: 'requestEmailChange'
			},
			{
				name: 'sendVerificationEmail'
			}
		];

		unauthorizedTestCases.forEach(({ name }) => {
			it(`${name} should return unauthorized when user not authenticated`, async () => {
				// Given
				const request = { isAuthenticated: () => false };
				const response = {}; // Simplified for this example

				// When
				await verificationController[name](request as any, response as any, nextFunction);

				// Then
				expect(nextFunction).toHaveBeenCalledWith(expect.any(UnauthorizedException));

				// Cleanup
				jest.restoreAllMocks();
			});
		});
	});
	describe('validateRequest method in verificationController', () => {
		const next = jest.fn();

		let longPassword = '';
		for (let i = 0; i < 300; i++) {
			longPassword = longPassword + 'a';
		}

		const testCases = [
			{
				description: 'should throw when password and confirmPassword do not match',
				input: { body: { password: 'password', confirmPassword: 'password1' } },
				expectThrow: true
			},
			{
				description: 'should not throw when password and confirmPassword do match',
				input: { body: { password: 'password', confirmPassword: 'password' } },
				expectThrow: false
			},
			{
				description: 'should throw when email is not valid',
				input: { body: { email: 'notAnEmail' } },
				expectThrow: true
			},
			{
				description: 'should throw when email contains html',
				input: { body: { email: '<script>alert("xss")</script>' + generateTemporaryUserEmail() } },
				expectThrow: true
			},
			{
				description: 'should not throw when email is valid',
				input: { body: { email: generateTemporaryUserEmail() } },
				expectThrow: false
			},
			{
				description: 'should throw when password is not string',
				input: { body: { password: 1 } },
				expectThrow: true
			},
			{
				description: 'should throw when password is >255',
				input: { body: { password: longPassword } },
				expectThrow: true
			},
			{
				description: 'should throw when password contains html',
				input: { body: { password: '<script>alert("xss")</script>' } },
				expectThrow: true
			},
			{
				description: 'should not throw when password is string',
				input: { body: { password: 'password' } },
				expectThrow: false
			},
			{
				description: 'should throw when token is not uuid',
				input: { query: { token: 'notAUUID' } },
				expectThrow: true
			},
			{
				description: 'should not throw when token is uuid',
				input: { query: { token: v4() } },
				expectThrow: false
			}
		];

		testCases.forEach(({ description, input, expectThrow }) => {
			it(description, () => {
				// when
				validateRequest(input as any, next, verificationController.validationSchema);

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