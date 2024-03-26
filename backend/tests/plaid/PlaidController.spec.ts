import PlaidController from '../../src/plaid/PlaidController'
import {randomUUID} from 'node:crypto'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        };
    })
}));

jest.mock('../../src/plaid/PlaidService', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createLinkToken: jest.fn(),
        }
    })
})

describe('Plaid controller', () => {
    const plaidController = new PlaidController();
    describe('in regards to normal operation', () => {
        test('should return a default link token', async () => {
            // given
            const request = { body: {} }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            let mockedLinkToken = randomUUID();
            (plaidController.plaidService.createLinkToken as jest.Mock).mockResolvedValue(mockedLinkToken)

            // when
            await plaidController.createLinkToken(request as any, response as any)

            // then
            expect(plaidController.plaidService.createLinkToken).toHaveBeenCalled();
            expect(response.status).toHaveBeenCalledWith(201)
            expect(response.send).toHaveBeenCalledWith({ link_token: mockedLinkToken })
        })
    })
})