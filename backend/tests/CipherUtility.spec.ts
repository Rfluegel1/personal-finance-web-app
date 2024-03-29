import {CipherUtility} from '../src/CipherUtility'

describe('CipherUtility', () => {
    it('decrypts hello world', () => {
        // given
        const encrypt = CipherUtility.encrypt('hello world')

        // when
        const decrypt = CipherUtility.decrypt(encrypt)

        // then
        expect(decrypt).toEqual('hello world')
    })
})