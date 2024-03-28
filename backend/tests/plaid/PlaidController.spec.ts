import PlaidController from '../../src/plaid/PlaidController'
import {randomUUID} from 'node:crypto'
import {StatusCodes} from 'http-status-codes'

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
            createAccessToken: jest.fn()
        }
    })
})

describe('Plaid controller', () => {
    const plaidController = new PlaidController()
    describe('in regards to normal operation', () => {
        test('should return response from service as link token', async () => {
            // given
            const request = {body: {}}
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }
            let mockedLinkToken = randomUUID();
            (plaidController.plaidService.createLinkToken as jest.Mock).mockResolvedValue({link_token: mockedLinkToken})

            // when
            await plaidController.createLinkToken(request as any, response as any)

            // then
            expect(plaidController.plaidService.createLinkToken).toHaveBeenCalled()
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(response.send).toHaveBeenCalledWith({link_token: mockedLinkToken})
        })

        test('should send public token to service and return access token from service', async () => {
            // given
            const request = {body: {public_token: 'public_token'}}
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }

            let mockedAccessToken = randomUUID();
            (plaidController.plaidService.createAccessToken as jest.Mock).mockImplementation((publicToken) => {
                if (publicToken === 'public_token') {
                    return mockedAccessToken
                }
            })

            // when
            await plaidController.createAccessToken(request as any, response as any)

            // then
            expect(plaidController.plaidService.createAccessToken).toHaveBeenCalledWith('public_token')
            expect(response.status).toHaveBeenCalledWith(StatusCodes.CREATED)
            expect(response.send).toHaveBeenCalledWith({access_token: mockedAccessToken})
        })
    })
})