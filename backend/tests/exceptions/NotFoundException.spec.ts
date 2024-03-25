import {NotFoundException} from '../../src/exceptions/NotFoundException'

describe('custom not found exception', () => {
    it('constructor sets id and name', async () => {
        const id = '1234'
        // when
        const dummyFunction = () => {
            throw new NotFoundException(id)
        }
        // then
        expect(dummyFunction).toThrow('Object not found for id=1234')
    })
})