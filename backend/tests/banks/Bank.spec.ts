import {UUID_REG_EXP} from '../../src/utils'
import Bank from '../../src/banks/Bank'

describe('Bank object', () => {
    it('default constructor sets default values', () => {
        // when
        const result: Bank = new Bank()
        // then
        expect(result.id).toMatch(UUID_REG_EXP)
        expect(result.accessToken).toEqual('')
        expect(result.owner).toEqual('')
        expect(result.itemId).toEqual('')
    })
    it('values constructor sets values', () => {
        // when
        const result: Bank = new Bank('the accessToken', 'the owner', 'the itemId')
        // then
        expect(result.id).toMatch(UUID_REG_EXP)
        expect(result.accessToken).toEqual('the accessToken')
        expect(result.owner).toEqual('the owner')
        expect(result.itemId).toEqual('the itemId')
    })
})
