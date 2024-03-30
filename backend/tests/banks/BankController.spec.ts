import {v4 as uuidv4} from 'uuid'
import {StatusCodes} from 'http-status-codes'
import {NextFunction} from 'express'
import {NotFoundException} from '../../src/exceptions/NotFoundException'
import {BadRequestException} from '../../src/exceptions/BadRequestException'
import {DatabaseException} from '../../src/exceptions/DatabaseException'
import {UnauthorizedException} from '../../src/exceptions/UnauthorizedException'
import * as constantsModule from '../../src/utils'
import {validateRequest} from '../../src/utils'
import BankController from '../../src/banks/BankController'

// setup
jest.mock('../../src/banks/BankService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createBank: jest.fn(),
            deleteBank: jest.fn(),
            getBank: jest.fn(),
            updateBank: jest.fn(),
            getBanksByOwner: jest.fn()
        }
    })
})

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        }
    })
}))

describe('Bank controller', () => {
    const bankController = new BankController()
    describe('in regards to normal operation', () => {
        beforeEach(() => {
            jest.spyOn(constantsModule, 'validateRequest').mockImplementation(() => true)
        })

        afterEach(() => {
            jest.clearAllMocks()
            jest.restoreAllMocks()
        })

        it('createBank responds with data that is returned from the BankService', async () => {
            // given
            const mockBank = {id: uuidv4(), accessToken: 'the accessToken', owner: 'the owner'}
            const request = {
                isAuthenticated: () => true,
                body: {accessToken: 'the accessToken'},
                user: { id: 'the owner', role: 'admin'}
            }
            const response = {
                status: jest.fn(function () {
                    return this
                }), send: jest.fn()
            };

            (bankController.bankService.createBank as jest.Mock).mockImplementation((accessToken, owner) => {
                if (accessToken === 'the accessToken' && owner === 'the owner') {
                    return mockBank
                }
            })

            // when
            await bankController.createBank(request as any, response as any, jest.fn())

            // then
            expect(response.send).toHaveBeenCalledWith(mockBank)
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
        })
        it('updateBank responds with data that is returned from the BankService', async () => {
            // given
            let id = uuidv4()
            const mockBank = {id: id, accessToken: 'the accessToken', owner: 'the owner'}
            const request = {
                params: {
                    id: id
                },
                body: {
                    accessToken: 'the accessToken',
                    owner: undefined
                },
                isAuthenticated: () => true,
                user: { role: 'admin'}
            }
            const response = {
                status: jest.fn(function () {
                    return this
                }),
                send: jest.fn()
            };

            (bankController.bankService.updateBank as jest.Mock).mockImplementation((sentId, accessToken, owner) => {
                if (sentId === id && accessToken === 'the accessToken' && owner === undefined) {
                    return mockBank
                }
            });

            (bankController.bankService.getBank as jest.Mock).mockImplementation((sentId) => {
                if (id === sentId) {
                    return mockBank
                }
            })

            // when
            await bankController.updateBank(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(response.send).toHaveBeenCalledWith(mockBank)
        })
        it('getBank responds with data that is returned from the BankService', async () => {
            // given
            let id: string = uuidv4()
            const mockBank = {id: id, accessToken: 'the accessToken', owner: 'the owner'}
            const request = {
                params: {id: id},
                isAuthenticated: () => true,
                user: {  role: 'admin' }
            }
            const response = {
                status: jest.fn(function () {
                    return this
                }),
                send: jest.fn()
            };

            (bankController.bankService.getBank as jest.Mock).mockImplementation((sentId) => {
                if (id === sentId) {
                    return mockBank
                }
            })

            // when
            await bankController.getBank(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(response.send).toHaveBeenCalledWith(mockBank)
        })
        it('deleteBank should call service and respond with NO_CONTENT', async () => {
            // given
            let id: string = uuidv4()
            const mockBank = {id: id, accessToken: 'the accessToken', owner: 'the owner'}
            const request = {
                isAuthenticated: () => true,
                params: {id: id},
                user: {  role: 'admin' }
            }
            const response = {
                sendStatus: jest.fn(function () {
                    return this
                })
            };

            (bankController.bankService.getBank as jest.Mock).mockImplementation((sentId) => {
                if (id === sentId) {
                    return mockBank
                } else {
                    return null
                }
            })

            // when
            await bankController.deleteBank(request as any, response as any, jest.fn())

            // then
            expect(bankController.bankService.deleteBank).toHaveBeenCalledWith(id)
            expect(response.sendStatus).toHaveBeenCalledWith(StatusCodes.NO_CONTENT)
        })
        it('getBanks by owner responds with data that is returned from the BankService', async () => {
            // given
            let id: string = uuidv4()
            let id2: string = uuidv4()
            const mockBank = {id: id, accessToken: 'the accessToken', owner: 'the owner'}
            const mockBank2 = {id: id2, accessToken: 'the accessToken', owner: 'the owner'}
            const request = {
                isAuthenticated: () => true,
                query: {
                    owner: 'the owner'
                },
                user: { role:'admin'}
            }
            const response = {
                status: jest.fn(function () {
                    return this
                }),
                send: jest.fn()
            };

            (bankController.bankService.getBanksByOwner as jest.Mock).mockImplementation((owner: string) => {
                if (owner === 'the owner') {
                    return [mockBank, mockBank2]
                }
            })

            // when
            await bankController.getBanksByOwner(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(response.send).toHaveBeenCalledWith({banks: [mockBank, mockBank2]})
        })
    })

    describe('in regards to unauthorized operation', () => {
        it.each`
    apiEndpoint              | controllerFunction
    ${'createBank'}          | ${bankController.createBank}
    ${'getBank'}             | ${bankController.getBank}
    ${'deleteBank'}          | ${bankController.deleteBank}
    ${'updateBank'}          | ${bankController.updateBank}
    ${'getBanksByOwner'} | ${bankController.getBanksByOwner}
    `('$apiEndpoint returns unauthorized when the request session is not authenticated', async (
            {controllerFunction}
        ) => {
            const request = {
                isAuthenticated: () => false,
                query: {owner: 'asd'}
            }
            const response = {
                status: jest.fn(function () {
                    return this
                }), send: jest.fn()
            }
            const next = jest.fn()

            // when
            await controllerFunction(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException))
        })

        it.each`
    apiEndpoint              | controllerFunction
    ${'createBank'}          | ${bankController.createBank}
    ${'getBank'}             | ${bankController.getBank}
    ${'deleteBank'}          | ${bankController.deleteBank}
    ${'updateBank'}          | ${bankController.updateBank}
    ${'getBanksByOwner'} | ${bankController.getBanksByOwner}
    `('$apiEndpoint returns unauthorized when the request session is not authenticated as admin', async (
            {controllerFunction}
        ) => {
            const request = {
                isAuthenticated: () => true,
                query: {owner: 'asd'},
                user: {role: 'user'}
            }
            const response = {
                status: jest.fn(function () {
                    return this
                }), send: jest.fn()
            }
            const next = jest.fn()

            // when
            await controllerFunction(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException))
        })
    })

    describe('in regards to error handling', () => {
        it('createBank should next error that is returned from the BankService', async () => {
            // given
            const request = {
                body: { accessToken: 'the accessToken' },
                user: {role: 'admin'},
                isAuthenticated: () => true
            };
            const response = {};

            (bankController.bankService.createBank as jest.Mock).mockImplementation(() => {
                throw new DatabaseException();
            });
            const next: NextFunction = jest.fn();

            // when
            await bankController.createBank(request as any, response as any, next);

            // then
            expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
        });
        it('deleteBank should next error that is returned from the BankService', async () => {
            // given
            let id: string = uuidv4();
            const request = {
                isAuthenticated: () => true,
                params: { id: id },
                user: {role: 'admin'}
            };
            const response = {};

            (bankController.bankService.deleteBank as jest.Mock).mockImplementation(() => {
                throw new DatabaseException();
            });
            const next: NextFunction = jest.fn();

            // when
            await bankController.deleteBank(request as any, response as any, next);

            // then
            expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
        });
        it('getBank should next error that is returned from the BankService', async () => {
            // given
            let id: string = uuidv4();
            const request = {
                isAuthenticated: () => true,
                user: {role: 'admin'},
                params: { id: id }
            };
            const response = {};

            (bankController.bankService.getBank as jest.Mock).mockImplementation(() => {
                throw new NotFoundException('id');
            });
            const next: NextFunction = jest.fn();

            // when
            await bankController.getBank(request as any, response as any, next);

            // then
            expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
        });
        it('getBanksByOwner should next error that is returned from the BankService', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                query: {
                    owner: 'the owner'
                },
                user: {role: 'admin'},
            };
            const response = {};

            (bankController.bankService.getBanksByOwner as jest.Mock).mockImplementation(() => {
                throw new DatabaseException();
            });
            const next: NextFunction = jest.fn();

            // when
            await bankController.getBanksByOwner(request as any, response as any, next);

            // then
            expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
        });
        it('updateBank should next error that is returned from the BankService', async () => {
            // given
            let id: string = uuidv4();
            const request = {
                isAuthenticated: () => true,
                user: {role: 'admin'},
                params: { id: id },
                body: { accessToken: 'the accessToken' }
            };
            const response = {};

            (bankController.bankService.updateBank as jest.Mock).mockImplementation(() => {
                throw new DatabaseException();
            });
            const next: NextFunction = jest.fn();

            // when
            await bankController.updateBank(request as any, response as any, next);

            // then
            expect(next).toHaveBeenCalledWith(expect.any(DatabaseException));
        });
    });

    test('getBanksByOwner should next error when owner is not provided', async () => {
        // given
        const request = {
            isAuthenticated: () => true,
            query: {},
            user: {role: 'admin'}
        }
        const response = {}
        const next = jest.fn()

        // when
        await bankController.getBanksByOwner(request as any, response as any, next)

        // then
        expect(next).toHaveBeenCalledWith(expect.any(BadRequestException))
    })
})