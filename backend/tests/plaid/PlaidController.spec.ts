import PlaidController from '../../src/plaid/PlaidController'
import {randomUUID} from 'node:crypto'
import {StatusCodes} from 'http-status-codes'
import {UnauthorizedException} from '../../src/exceptions/UnauthorizedException'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        }
    })
}))

jest.mock('../../src/plaid/PlaidService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createLinkToken: jest.fn(),
            exchangeTokenAndSaveBank: jest.fn(),
            getOverview: jest.fn(),
            createUpdateLinkToken: jest.fn(),
            exchangeTokenAndUpdateBank: jest.fn()
        }
    })
})

describe('Plaid controller', () => {
    const plaidController = new PlaidController()
    describe('in regards to normal operation', () => {
        test('should return response from service as link token', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            let mockedLinkToken = randomUUID();
            (plaidController.plaidService.createLinkToken as jest.Mock).mockImplementation((userId) => {
                if (userId === 'user') {
                    return {link_token: mockedLinkToken}
                }
            })

            // when
            await plaidController.createLinkToken(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(response.send).toHaveBeenCalledWith({link_token: mockedLinkToken})
        })

        test('should return response from service as update link token', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                body: {itemId: 'itemId'},
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            let mockedLinkToken = randomUUID();
            (plaidController.plaidService.createUpdateLinkToken as jest.Mock).mockImplementation((userId, itemId) => {
                if (userId === 'user' && itemId === 'itemId') {
                    return {link_token: mockedLinkToken}
                }
            })

            // when
            await plaidController.createUpdateLinkToken(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(response.send).toHaveBeenCalledWith({link_token: mockedLinkToken})
        })

        test('should send public token to service and return bank id from service', async () => {
            // given
            const request = {
                body: {public_token: 'public_token'},
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }

            let mockedBankId = randomUUID();
            (plaidController.plaidService.exchangeTokenAndSaveBank as jest.Mock).mockImplementation((publicToken, user) => {
                if (publicToken === 'public_token' && user === 'user') {
                    return {bankId: mockedBankId}
                }
            })

            // when
            await plaidController.exchangeTokenAndSaveBank(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(response.send).toHaveBeenCalledWith({bankId: mockedBankId})
        })
        test('should send public token and bankId to service and return bank id from service', async () => {
            // given
            const request = {
                body: {public_token: 'public_token', bankId: 'bankId'},
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            (plaidController.plaidService.exchangeTokenAndUpdateBank as jest.Mock).mockImplementation((publicToken, bankId) => {
                if (publicToken === 'public_token' && bankId === 'bankId') {
                    return {bankId: 'bankId'}
                }
            })

            // when
            await plaidController.exchangeTokenAndUpdateBank(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(response.send).toHaveBeenCalledWith({bankId: 'bankId'})
        })

        test('should return bank names from service', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            let mockedBankNames = ['bank1', 'bank2'];
            (plaidController.plaidService.getOverview as jest.Mock).mockImplementation((owner) => {
                if (owner === 'user') {
                    return {bankNames: mockedBankNames}
                }
            })

            // when
            await plaidController.getOverview(request as any, response as any, jest.fn())

            // then
            expect(response.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(response.send).toHaveBeenCalledWith({bankNames: mockedBankNames})
        })
    })

    describe('in regards to error handling', () => {
        test('should call next with error when link token creation fails', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            const next = jest.fn()
            const error = new Error('error');
            (plaidController.plaidService.createLinkToken as jest.Mock).mockRejectedValue(error)

            // when
            await plaidController.createLinkToken(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(error)
        })

        test('should call next with error when update link token creation fails', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                body: {itemId: 'itemId'},
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            const next = jest.fn()
            const error = new Error('error');
            (plaidController.plaidService.createUpdateLinkToken as jest.Mock).mockRejectedValue(error)

            // when
            await plaidController.createUpdateLinkToken(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(error)
        })

        test('should call next with error when access token creation and bank save fails', async () => {
            // given
            const request = {
                body: {public_token: 'public_token'},
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            const next = jest.fn()
            const error = new Error('error');
            (plaidController.plaidService.exchangeTokenAndSaveBank as jest.Mock).mockRejectedValue(error)

            // when
            await plaidController.exchangeTokenAndSaveBank(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(error)
        })
        test('should call next with error when access token creation and bank update fails', async () => {
            // given
            const request = {
                body: {public_token: 'public_token'},
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            const next = jest.fn()
            const error = new Error('error');
            (plaidController.plaidService.exchangeTokenAndUpdateBank as jest.Mock).mockRejectedValue(error)

            // when
            await plaidController.exchangeTokenAndUpdateBank(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(error)
        })

        test('should call next with error when get bank names fails', async () => {
            // given
            const request = {
                isAuthenticated: () => true,
                user: {id: 'user'}
            }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            const next = jest.fn()
            const error = new Error('error');
            (plaidController.plaidService.getOverview as jest.Mock).mockRejectedValue(error)

            // when
            await plaidController.getOverview(request as any, response as any, next)

            // then
            expect(next).toHaveBeenCalledWith(error)
        })
    })

    it.each`
    apiEndpoint                     | controllerFunction
    ${'exchangeTokenAndSaveBank'}   | ${plaidController.exchangeTokenAndSaveBank}
    ${'createLinkToken'}            | ${plaidController.createLinkToken}
    ${'createUpdateLinkToken'}      | ${plaidController.createUpdateLinkToken}
    ${'getOverView'}                | ${plaidController.getOverview}
    ${'exchangeTokenAndUpdateBank'} | ${plaidController.exchangeTokenAndUpdateBank}
    `('$apiEndpoint returns unauthorized when the request session is not authenticated', async (
        {controllerFunction}
    ) => {
        const request = {
            isAuthenticated: () => false,
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