import {DatabaseException} from '../../src/exceptions/DatabaseException'

describe('custom database exception', () => {
    it('constructor returns message and sets name', async () => {
        // when
        const dummyFunction = () => {
            throw new DatabaseException()
        }
        // then
        expect(dummyFunction).toThrow('Error interacting with the database')
    })
})