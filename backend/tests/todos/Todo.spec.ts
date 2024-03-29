import Todo from '../../src/todos/Todo'
import {UUID_REG_EXP} from '../../src/utils'

describe('Todo object', () => {
    it('default constructor sets default values', () => {
        // when
        const result: Todo = new Todo()
        // then
        expect(result.id).toMatch(UUID_REG_EXP)
        expect(result.task).toEqual('')
        expect(result.createdBy).toEqual('')
    })
    it('values constructor sets values', () => {
        // when
        const result: Todo = new Todo('the task', 'the createdBy')
        // then
        expect(result.id).toMatch(UUID_REG_EXP)
        expect(result.task).toEqual('the task')
        expect(result.createdBy).toEqual('the createdBy')
    })
})
