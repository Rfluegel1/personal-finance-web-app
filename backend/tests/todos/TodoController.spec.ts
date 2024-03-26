import TodoController from '../../src/todos/TodoController';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { NextFunction } from 'express';
import { NotFoundException } from '../../src/exceptions/NotFoundException';
import { BadRequestException } from '../../src/exceptions/BadRequestException';
import { DatabaseException } from '../../src/exceptions/DatabaseException';
import { UnauthorizedException } from '../../src/exceptions/UnauthorizedException';
import * as constantsModule from '../../src/utils';
import { validateRequest } from '../../src/utils';

// setup
jest.mock('../../src/todos/TodoService', () => {
	return jest.fn().mockImplementation(() => {
		return {
			createTodo: jest.fn(),
			deleteTodo: jest.fn(),
			getTodosByCreatedBy: jest.fn(),
			getTodo: jest.fn(),
			updateTodo: jest.fn()
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

describe('Todo controller', () => {
	const todoController = new TodoController();
	describe('in regards to normal operation', () => {
		beforeEach(() => {
			jest.spyOn(constantsModule, 'validateRequest').mockImplementation(() => true);
		});

		afterEach(() => {
			jest.clearAllMocks();
			jest.restoreAllMocks();
		});

		it('createTodo responds with data that is returned from the TodoService', async () => {
			// given
			const mockTodo = { id: uuidv4(), task: 'the task', createdBy: 'the createdBy' };
			const request = {
				isAuthenticated: () => true,
				body: { task: 'the task' },
				user: { id: 'the createdBy' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};

			(todoController.todoService.createTodo as jest.Mock).mockImplementation((task, createdBy) => {
				if (task === 'the task' && createdBy === 'the createdBy') {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.createTodo(request as any, response as any, jest.fn());

			// then
			expect(response.send).toHaveBeenCalledWith({ message: mockTodo });
			expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED);
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('updateTodo responds with data that is returned from the TodoService', async () => {
			// given
			let id = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'the createdBy' };
			const request = {
				params: {
					id: id
				},
				body: {
					task: 'the task',
					createdBy: undefined
				},
				isAuthenticated: () => true,
				user: { id: 'the createdBy' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(todoController.todoService.updateTodo as jest.Mock).mockImplementation((sentId, task, createdBy) => {
				if (sentId === id && task === 'the task' && createdBy === undefined) {
					return mockTodo;
				} else {
					return null;
				}
			});

			(todoController.todoService.getTodo as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.updateTodo(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith({ message: mockTodo });
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('getTodo responds with data that is returned from the TodoService', async () => {
			// given
			let id: string = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'the createdBy' };
			const request = {
				params: { id: id },
				isAuthenticated: () => true,
				user: { id: 'the createdBy' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(todoController.todoService.getTodo as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.getTodo(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith({ message: mockTodo });
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('deleteTodo should call service and respond with NO_CONTENT', async () => {
			// given
			let id: string = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'the createdBy' };
			const request = {
				isAuthenticated: () => true,
				params: { id: id },
				user: { id: 'the createdBy' }
			};
			const response = {
				sendStatus: jest.fn(function() {
					return this;
				})
			};

			(todoController.todoService.getTodo as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.deleteTodo(request as any, response as any, jest.fn());

			// then
			expect(todoController.todoService.deleteTodo).toHaveBeenCalledWith(id);
			expect(response.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
		it('getTodosByCreatedBy responds with data that is returned from the TodoService', async () => {
			// given
			let id: string = uuidv4();
			let id2: string = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'the createdBy' };
			const mockTodo2 = { id: id2, task: 'the task', createdBy: 'the createdBy' };
			const request = {
				isAuthenticated: () => true,
				query: {
					createdBy: 'the createdBy'
				},
				user: { id: 'the createdBy' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}),
				send: jest.fn()
			};

			(todoController.todoService.getTodosByCreatedBy as jest.Mock).mockImplementation((createdBy: string) => {
				if (createdBy === 'the createdBy') {
					return [mockTodo, mockTodo2];
				} else {
					return null;
				}
			});

			// when
			await todoController.getTodosByCreatedBy(request as any, response as any, jest.fn());

			// then
			expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
			expect(response.send).toHaveBeenCalledWith({ message: [mockTodo, mockTodo2] });
			expect(constantsModule.validateRequest).toHaveBeenCalled();
		});
	});

	describe('in regards to unauthorized operation', () => {
		it.each`
    apiEndpoint              | controllerFunction
    ${'createTodo'}          | ${todoController.createTodo}
    ${'getTodo'}             | ${todoController.getTodo}
    ${'deleteTodo'}          | ${todoController.deleteTodo}
    ${'updateTodo'}          | ${todoController.updateTodo}
    ${'getTodosByCreatedBy'} | ${todoController.getTodosByCreatedBy}
    `('$apiEndpoint returns unauthorized when the request session is not authenticated', async (
			{ controllerFunction }
		) => {
			const request = {
				isAuthenticated: () => false,
				query: { createdBy: 'asd' }
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

		it('getTodo returns unauthorized when user id does not match todo createdBy', async () => {
			const id = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'other' };
			const request = {
				isAuthenticated: () => true,
				user: { id: 'createdBy' },
				params: { id: id }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			const next = jest.fn();

			(todoController.todoService.getTodo as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.getTodo(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
		});
		it('updateTodo returns unauthorized when user id does not match todo createdBy', async () => {
			const id = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'other' };
			const request = {
				isAuthenticated: () => true,
				user: { id: 'createdBy' },
				params: { id: id },
				body: { task: 'the task' }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			const next = jest.fn();

			(todoController.todoService.getTodo as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.updateTodo(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
		});
		it('deleteTodo returns unauthorized when user id does not match todo createdBy', async () => {
			const id = uuidv4();
			const mockTodo = { id: id, task: 'the task', createdBy: 'other' };
			const request = {
				isAuthenticated: () => true,
				user: { id: 'createdBy' },
				params: { id: id }
			};
			const response = {
				status: jest.fn(function() {
					return this;
				}), send: jest.fn()
			};
			const next = jest.fn();

			(todoController.todoService.getTodo as jest.Mock).mockImplementation((sentId) => {
				if (id === sentId) {
					return mockTodo;
				} else {
					return null;
				}
			});

			// when
			await todoController.deleteTodo(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
		});
	});

	describe('in regards to error handling', () => {
		it('createTodo should next error that is returned from the TodoService', async () => {
			// given
			const request = {
				body: { task: 'the task' },
				user: { id: 'the createdBy' },
				isAuthenticated: () => true
			};
			const response = {};

			(todoController.todoService.createTodo as jest.Mock).mockImplementation(() => {
				throw new DatabaseException();
			});
			const next: NextFunction = jest.fn();

			// when
			await todoController.createTodo(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
		});
		it('getTodo should next error that is returned from the TodoService', async () => {
			// given
			let id: string = uuidv4();
			const request = {
				isAuthenticated: () => true,
				params: { id: id }
			};
			const response = {};

			(todoController.todoService.getTodo as jest.Mock).mockImplementation(() => {
				throw new NotFoundException('id');
			});
			const next: NextFunction = jest.fn();

			// when
			await todoController.getTodo(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
		});
		it('getTodosByCreatedBy should next error that is returned from the TodoService', async () => {
			// given
			const request = {
				isAuthenticated: () => true,
				query: {
					createdBy: 'the createdBy'
				},
				user: { id: 'the createdBy' }
			};
			const response = {};

			(todoController.todoService.getTodosByCreatedBy as jest.Mock).mockImplementation(() => {
				throw new DatabaseException();
			});
			const next: NextFunction = jest.fn();

			// when
			await todoController.getTodosByCreatedBy(request as any, response as any, next);

			// then
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
		});
	});

	describe('validateRequest method in todoController', () => {
		const next = jest.fn();

		let longTask = '';
		for (let i = 0; i < 300; i++) {
			longTask = longTask + 'a';
		}

		const testCases = [
			{
				description: 'should throw when id is not uuid',
				input: { body: { id: 'notUuid' } },
				expectThrow: true
			},
			{
				description: 'should not throw when id is uuid',
				input: { body: { id: uuidv4() } },
				expectThrow: false
			},
			{
				description: 'should throw when createdBy is not uuid',
				input: { body: { createdBy: 'notUuid' } },
				expectThrow: true
			},
			{
				description: 'should not throw when createdBy is uuid',
				input: { body: { createdBy: uuidv4() } },
				expectThrow: false
			},
			{
				description: 'should throw when task is not string',
				input: { body: { task: 1 } },
				expectThrow: true
			},
			{
				description: 'should throw when task is >255',
				input: { body: { task: longTask } },
				expectThrow: true
			},
			{
				description: 'should throw when task contains html',
				input: { body: { task: '<script>alert("xss")</script>' } },
				expectThrow: true
			},
			{
				description: 'should not throw when task is string',
				input: { body: { task: 'squash bugs' } },
				expectThrow: false
			}
		];

		testCases.forEach(({ description, input, expectThrow }) => {
			it(description, () => {
				// when
				validateRequest(input as any, next, todoController.validationSchema);

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