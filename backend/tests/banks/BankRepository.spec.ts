import BankRepository from '../../src/banks/BankRepository';
import { v4 as uuidv4 } from 'uuid';
import Bank from '../../src/banks/Bank';
import { NotFoundException } from '../../src/exceptions/NotFoundException';

// setup
jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            error: jest.fn()
        };
    })
}));

const repository = new BankRepository();
beforeEach(() => {
    repository.bankRepository.save = jest.fn();
    repository.bankRepository.delete = jest.fn();
    repository.bankRepository.findOne = jest.fn();
    repository.bankRepository.find = jest.fn();
});

describe('Bank repository', () => {

    describe('in regards to normal operations', () => {
        it('createBank inserts into bankRepository', async () => {
            //given
            const bank = new Bank('the accessToken', 'the owner');
            // when
            await repository.saveBank(bank);
            // then
            expect(repository.bankRepository.save).toHaveBeenCalledWith(
                bank
            );
        });
        it('getBank selects from bankRepository', async () => {
            //given
            const id = uuidv4();
            (repository.bankRepository.findOne as jest.Mock).mockImplementation(jest.fn((options) => {
                if (options.where.id === id) {
                    let bank = new Bank('the accessToken', 'the owner');
                    bank.id = id;
                    return bank;
                }
            }));
            // when
            const actual = await repository.getBank(id);
            // then
            expect(actual).toBeInstanceOf(Bank);
            expect(actual.id).toEqual(id);
            expect(actual.accessToken).toEqual('the accessToken');
            expect(actual.owner).toEqual('the owner');
        });
        it('getBanksByOwner selects from bankRepository', async () => {
            //given
            const id1 = uuidv4();
            const id2 = uuidv4();
            const mockBank1 = new Bank('the accessToken1', 'the owner');
            mockBank1.id = id1;
            const mockBank2 = new Bank('the accessToken2', 'the owner');
            mockBank2.id = id2;
            (repository.bankRepository.find as jest.Mock).mockImplementation(jest.fn((options) => {
                if (options.where.owner === 'the owner') {
                    return [mockBank1, mockBank2];
                }
            }));

            // when
            const actual = await repository.getBanksByOwner('the owner');

            // then
            expect(actual.length).toEqual(2);
            expect(actual[0]).toBeInstanceOf(Bank);
            expect(actual[0].id).toEqual(id1);
            expect(actual[0].accessToken).toEqual('the accessToken1');
            expect(actual[0].owner).toEqual('the owner');
            expect(actual[1]).toBeInstanceOf(Bank);
            expect(actual[1].id).toEqual(id2);
            expect(actual[1].accessToken).toEqual('the accessToken2');
            expect(actual[1].owner).toEqual('the owner');
        });
        it('getBanksByItemId selects from bankRepository', async () => {
            //given
            const id1 = uuidv4();
            const mockBank1 = new Bank('the accessToken1', 'the owner', 'theItemId');
            mockBank1.id = id1;
            (repository.bankRepository.findOne as jest.Mock).mockImplementation(jest.fn((options) => {
                if (options.where.itemId === 'theItemId') {
                    return mockBank1
                }
            }));

            // when
            const actual = await repository.getBankByItemId('theItemId');

            // then
            expect(actual).toBeInstanceOf(Bank);
            expect(actual.id).toEqual(id1);
            expect(actual.accessToken).toEqual('the accessToken1');
            expect(actual.owner).toEqual('the owner');
            expect(actual.itemId).toEqual('theItemId');
        });
        it('deleteBank deletes from bankRepository', async () => {
            //given
            const id = uuidv4();
            // when
            await repository.deleteBank(id);
            // then
            expect(repository.bankRepository.delete).toHaveBeenCalledWith(id);
        });
    });

    describe('in regards to error handling', () => {
        it('saveBank throws database exception', async () => {
            //given
            let error = new Error('DB Error');
            (repository.bankRepository.save as jest.Mock).mockRejectedValue(error);
            //expect
            await expect(repository.saveBank(new Bank())).rejects.toThrow('Error interacting with the database');
        });
        it('getBank throws database exception', async () => {
            // given
            let error = new Error('DB Error');
            (repository.bankRepository.findOne as jest.Mock).mockRejectedValue(error);
            //expect
            await expect(repository.getBank(uuidv4())).rejects.toThrow('Error interacting with the database');
        });
        it('getBanksByOwner throws database exception', async () => {
            // given
            let error = new Error('DB Error');
            (repository.bankRepository.find as jest.Mock).mockRejectedValue(error);
            //expect
            await expect(repository.getBanksByOwner('asd')).rejects.toThrow('Error interacting with the database');
        });
        it('getBanksByOwner throws database exception', async () => {
            // given
            let error = new Error('DB Error');
            (repository.bankRepository.findOne as jest.Mock).mockRejectedValue(error);
            //expect
            await expect(repository.getBankByItemId('asd')).rejects.toThrow('Error interacting with the database');
        });
        it('deleteBank throws database exception', async () => {
            // given
            let error = new Error('DB Error');
            (repository.bankRepository.delete as jest.Mock).mockRejectedValue(error);
            //expect
            await expect(repository.deleteBank(uuidv4())).rejects.toThrow('Error interacting with the database');
        });
    });

    it('getBank throws not found when query result is empty', async () => {
        //given
        (repository.bankRepository.findOne as jest.Mock).mockImplementation(jest.fn(() => {
            return null;
        }));
        // when and then
        await expect(() => repository.getBank(uuidv4())).rejects.toThrow(NotFoundException);
    });
    it('getBankByItemId throws not found when query result is empty', async () => {
        //given
        (repository.bankRepository.findOne as jest.Mock).mockImplementation(jest.fn(() => {
            return null;
        }));
        // when and then
        await expect(() => repository.getBankByItemId(uuidv4())).rejects.toThrow(NotFoundException);
    });
});
