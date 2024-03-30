import {v4 as uuidv4} from 'uuid'
import {UUID_REG_EXP} from '../../src/utils'
import BankService from '../../src/banks/BankService'
import Bank from '../../src/banks/Bank'
import {CipherUtility} from '../../src/CipherUtility'
import {randomUUID} from 'node:crypto'

// setup
jest.mock('../../src/banks/BankRepository', () => {
    return jest.fn().mockImplementation(() => {
        return {
            saveBank: jest.fn(),
            deleteBank: jest.fn(),
            getBank: jest.fn(),
            getBanksByOwner: jest.fn(),
        }
    })
})

jest.mock('../../src/CipherUtility')

describe('Bank service', () => {
    let service: BankService = new BankService()
    it('createBank should call repository and returns Bank', async () => {
        let encrypted = randomUUID();
        (CipherUtility.encrypt as jest.Mock).mockReturnValue(encrypted)
        const expectedBank = {accessToken: encrypted, owner: 'the owner'}
        // when
        let result: Bank = await service.createBank('the accessToken', 'the owner')
        // then
        expect(service.bankRepository.saveBank).toHaveBeenCalledWith(expect.objectContaining(expectedBank))
        expect(result.accessToken).toEqual(encrypted)
        expect(result.owner).toEqual('the owner')
        expect(result.id).toMatch(UUID_REG_EXP)
    })
    it('updateBank gets from repository, calls repository to update, and returns Bank', async () => {
        //given
        let encrypted = randomUUID();
        (CipherUtility.encrypt as jest.Mock).mockReturnValue(encrypted)
        const id: string = uuidv4()
        const expectedBank = {accessToken: encrypted, owner: 'the owner'};
        (service.bankRepository.getBank as jest.Mock).mockImplementation(jest.fn(() => {
            let bank = new Bank()
            bank.id = id
            return bank
        }))
        // when
        let result: Bank = await service.updateBank(id, 'the accessToken', 'the owner')
        // then
        expect(service.bankRepository.saveBank).toHaveBeenCalledWith(expect.objectContaining(expectedBank))
        expect(result.accessToken).toEqual(encrypted)
        expect(result.owner).toEqual('the owner')
        expect(result.id).toEqual(id)
    })
    it.each`
    accessToken          | owner          | expected
    ${undefined}         | ${undefined}   | ${{accessToken: 'old accessToken', owner: 'old owner'}}
    ${'new accessToken'} | ${'new owner'} | ${{accessToken: randomUUID(), owner: 'new owner'}}
    `('updateBank only sets defined fields on updated Bank',
        async ({accessToken, owner, expected}) => {
            //given
            (CipherUtility.encrypt as jest.Mock).mockReturnValue(expected.accessToken)
            const existingBank = new Bank('old accessToken', 'old owner');
            (service.bankRepository.getBank as jest.Mock).mockImplementation((sentId: string) => {
                if (sentId === existingBank.id) {
                    return existingBank
                }
            })
            // when
            let result: Bank = await service.updateBank(existingBank.id, accessToken, owner)
            // then
            expect(service.bankRepository.saveBank).toHaveBeenCalledWith(expect.objectContaining(expected))
            expect(result.accessToken).toEqual(expected.accessToken)
            expect(result.owner).toEqual(expected.owner)
            expect(result.id).toEqual(existingBank.id)
        })

    it('getBank returns todos from repository', async () => {
        //given
        let decrypted = randomUUID();
        (CipherUtility.decrypt as jest.Mock).mockReturnValue(decrypted)
        const id: string = uuidv4()
        const mockBank = {id: id, accessToken: 'the accessToken', owner: 'the owner'};

        (service.bankRepository.getBank as jest.Mock).mockImplementation((sentId: string) => {
            if (sentId === id) {
                return mockBank
            }
        })
        // when
        const result: Bank = await service.getBank(id)
        // then
        expect(result.accessToken).toEqual(decrypted)
        expect(result.owner).toEqual('the owner')
        expect(result.id).toEqual(id)
    })
    it('getBanksByOwner returns todos from repository', async () => {
        //given
        let firstDecrypted = randomUUID();
        (CipherUtility.decrypt as jest.Mock).mockReturnValueOnce(firstDecrypted)
        let secondDecrypted = randomUUID();
        (CipherUtility.decrypt as jest.Mock).mockReturnValueOnce(secondDecrypted)
        const id1: string = uuidv4()
        const id2: string = uuidv4()
        const mockBank1: Bank = new Bank('the accessToken', 'the owner')
        const mockBank2: Bank = new Bank('the accessToken', 'the owner')
        mockBank1.id = id1
        mockBank2.id = id2;

        (service.bankRepository.getBanksByOwner as jest.Mock).mockImplementation((owner: string) => {
            if (owner === 'the owner') {
                return [mockBank1, mockBank2]
            }
        })
        // when
        const result: Bank[] = await service.getBanksByOwner('the owner')
        // then
        expect(result.length).toEqual(2)

        let firstBank = result.find((todo: Bank): boolean => todo.id === id1)
        expect(firstBank).toBeInstanceOf(Bank)
        expect(firstBank?.accessToken).toEqual(firstDecrypted)
        expect(firstBank?.owner).toEqual('the owner')

        let secondBank = result.find((todo: Bank): boolean => todo.id === id2)
        expect(secondBank?.accessToken).toEqual(secondDecrypted)
        expect(secondBank?.owner).toEqual('the owner')
        expect(secondBank?.id).toEqual(id2)
    })
    it('delete calls to repo', async () => {
        //given
        const id: string = uuidv4()
        // when
        await service.deleteBank(id)
        // then
        expect(service.bankRepository.deleteBank).toHaveBeenCalledWith(id)
    })
})
