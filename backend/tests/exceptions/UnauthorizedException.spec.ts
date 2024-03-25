import {UnauthorizedException} from '../../src/exceptions/UnauthorizedException'

describe('custom unauthorized request exception', () => {
    it('constructor sets message and name', async () => {
        const action = 'the action'
        // when
        const dummyFunction = () => {
            throw new UnauthorizedException(action)
        }
        // then
        expect(dummyFunction).toThrow(`Unauthorized: You must be logged in to perform action=${action}.`)
    })
})