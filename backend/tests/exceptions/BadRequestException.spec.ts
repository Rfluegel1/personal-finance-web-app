import {BadRequestException} from '../../src/exceptions/BadRequestException'

describe('custom bad request exception', () => {
    it('constructor sets message and name', async () => {
        // when
        const dummyFunction = () => {
            throw new BadRequestException('this is a long message')
        }
        // then
        expect(dummyFunction).toThrow('this is a long message')
    })
})