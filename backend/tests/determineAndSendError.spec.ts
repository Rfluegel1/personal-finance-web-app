import { Request, Response } from 'express';
import { determineAndSendError } from '../src/utils';
import { NotFoundException } from '../src/exceptions/NotFoundException';
import { BadRequestException } from '../src/exceptions/BadRequestException';
import { DatabaseException } from '../src/exceptions/DatabaseException';
import { DuplicateRowException } from '../src/exceptions/DuplicateRowException';
import { UnauthorizedException } from '../src/exceptions/UnauthorizedException';

jest.mock('../src/logger', () => ({
	getLogger: jest.fn(() => {
		return {
			error: jest.fn()
		};
	})
}));
describe('Error Handling Middleware', () => {
	let request: Partial<Request>;
	let response: Partial<Response>;
	let next: jest.Mock;

	beforeEach(() => {
		request = {};
		response = { status: jest.fn().mockReturnThis(), send: jest.fn() };
		next = jest.fn();
	});

	test('should set message and status to 500 when error is not recognized', () => {
		// given
		const error = new Error('Generic Error');
		// when
		determineAndSendError()(error, request as Request, response as Response, next);
		// then
		expect(response.status).toHaveBeenCalledWith(500);
		expect(response.send).toHaveBeenCalledWith({ message: 'Generic Internal Server Error' });
	});

	test('should handle NotFoundException by setting status to 404 and sending the correct message', () => {
		const error = new NotFoundException('Not found error');

		determineAndSendError()(error, request as Request, response as Response, next);

		expect(response.status).toHaveBeenCalledWith(404);
		expect(response.send).toHaveBeenCalledWith({ message: 'Object not found for id=Not found error' });
	});

	test('should handle BadRequestException by setting status to 400 and sending the correct message', () => {
		const error = new BadRequestException('Bad request error');

		determineAndSendError()(error, request as Request, response as Response, next);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.send).toHaveBeenCalledWith({ message: 'Bad request error' });
	});

	test('should handle DatabaseException by setting status to 500 and sending the correct message', () => {
		const error = new DatabaseException();

		determineAndSendError()(error, request as Request, response as Response, next);

		expect(response.status).toHaveBeenCalledWith(500);
		expect(response.send).toHaveBeenCalledWith({ message: 'Error interacting with the database' });
	});

	test('should handle DuplicateRowException by setting status to 409 and sending the correct message', () => {
		const error = new DuplicateRowException('Duplicate row error');

		determineAndSendError()(error, request as Request, response as Response, next);

		expect(response.status).toHaveBeenCalledWith(409);
		expect(response.send).toHaveBeenCalledWith({ message: 'Duplicate key value violates unique constraint=Duplicate row error' });
	});

	test('should handle UnauthorizedException by setting status to 401 and sending the correct message', () => {
		const error = new UnauthorizedException('Unauthorized error');

		determineAndSendError()(error, request as Request, response as Response, next);

		expect(response.status).toHaveBeenCalledWith(401);
		expect(response.send).toHaveBeenCalledWith({ message: 'Unauthorized: You must be logged in to perform action=Unauthorized error.' });
	});

	test('should set message and status to 404 when error message is "Path not found"', () => {
		const error = new Error('Path not found');

		determineAndSendError()(error, request as Request, response as Response, next);

		expect(response.status).toHaveBeenCalledWith(404);
		expect(response.send).toHaveBeenCalledWith({ message: 'Path not found' });
	});
});
