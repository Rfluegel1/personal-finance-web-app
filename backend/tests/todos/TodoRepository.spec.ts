import TodoRepository from '../../src/todos/TodoRepository';
import { v4 as uuidv4 } from 'uuid';
import Todo from '../../src/todos/Todo';
import { NotFoundException } from '../../src/exceptions/NotFoundException';

// setup
jest.mock('../../src/logger', () => ({
	getLogger: jest.fn(() => {
		return {
			error: jest.fn()
		};
	})
}));

const repository = new TodoRepository();
beforeEach(() => {
	repository.todoRepository.save = jest.fn();
	repository.todoRepository.delete = jest.fn();
	repository.todoRepository.findOne = jest.fn();
	repository.todoRepository.find = jest.fn();
});

describe('Todo repository', () => {

	describe('in regards to normal operations', () => {
		it('createTodo inserts into todoRepository', async () => {
			//given
			const todo = new Todo('the task', 'the createdBy');
			// when
			await repository.createTodo(todo);
			// then
			expect(repository.todoRepository.save).toHaveBeenCalledWith(
				todo
			);
		});
		it('getTodo selects from todoRepository', async () => {
			//given
			const id = uuidv4();
			(repository.todoRepository.findOne as jest.Mock).mockImplementation(jest.fn((options) => {
				if (options.where.id === id) {
					let todo = new Todo('the task', 'the createdBy');
					todo.id = id;
					return todo;
				}
			}));
			// when
			const actual = await repository.getTodo(id);
			// then
			expect(actual).toBeInstanceOf(Todo);
			expect(actual.id).toEqual(id);
			expect(actual.task).toEqual('the task');
			expect(actual.createdBy).toEqual('the createdBy');
		});
		it('getTodosByCreatedBy selects from todoRepository', async () => {
			//given
			const id1 = uuidv4();
			const id2 = uuidv4();
			const mockTodo1 = new Todo('the task1', 'the createdBy');
			mockTodo1.id = id1;
			const mockTodo2 = new Todo('the task2', 'the createdBy');
			mockTodo2.id = id2;
			(repository.todoRepository.find as jest.Mock).mockImplementation(jest.fn((options) => {
				if (options.where.createdBy === 'the createdBy') {
					return [mockTodo1, mockTodo2];
				}
			}));

			// when
			const actual = await repository.getTodosByCreatedBy('the createdBy');
			// then
			expect(actual.length).toEqual(2);
			expect(actual[0]).toBeInstanceOf(Todo);
			expect(actual[0].id).toEqual(id1);
			expect(actual[0].task).toEqual('the task1');
			expect(actual[0].createdBy).toEqual('the createdBy');
			expect(actual[1]).toBeInstanceOf(Todo);
			expect(actual[1].id).toEqual(id2);
			expect(actual[1].task).toEqual('the task2');
			expect(actual[1].createdBy).toEqual('the createdBy');
		});
		it('deleteTodo deletes from todoRepository', async () => {
			//given
			const id = uuidv4();
			// when
			await repository.deleteTodo(id);
			// then
			expect(repository.todoRepository.delete).toHaveBeenCalledWith(id);
		});
		it('updateTodo updates todos in todoRepository', async () => {
			//given
			const mockTodo = new Todo('the new task', 'the new createdBy');
			// when
			await repository.updateTodo(mockTodo);
			// then
			expect(repository.todoRepository.save).toHaveBeenCalledWith(
				mockTodo
			);
		});
	});

	describe('in regards to error handling', () => {
		it('createTodo throws database exception', async () => {
			//given
			let error = new Error('DB Error');
			(repository.todoRepository.save as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.createTodo(new Todo())).rejects.toThrow('Error interacting with the database');
		});
		it('getTodo throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.todoRepository.findOne as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getTodo(uuidv4())).rejects.toThrow('Error interacting with the database');
		});
		it('getTodosByCreatedBy throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.todoRepository.find as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.getTodosByCreatedBy('asd')).rejects.toThrow('Error interacting with the database');
		});
		it('deleteTodo throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.todoRepository.delete as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.deleteTodo(uuidv4())).rejects.toThrow('Error interacting with the database');
		});
		it('updateTodo throws database exception', async () => {
			// given
			let error = new Error('DB Error');
			(repository.todoRepository.save as jest.Mock).mockRejectedValue(error);
			//expect
			await expect(repository.updateTodo(new Todo())).rejects.toThrow('Error interacting with the database');
		});
	});

	it('getTodo throws not found when query result is empty', async () => {
		//given
		(repository.todoRepository.findOne as jest.Mock).mockImplementation(jest.fn(() => {
			return null;
		}));
		// when and then
		await expect(() => repository.getTodo(uuidv4())).rejects.toThrow(NotFoundException);
	});
});
