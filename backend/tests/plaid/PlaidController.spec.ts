import PlaidController from '../../src/plaid/PlaidController'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        };
    })
}));
describe('Plaid controller', () => {
    const plaidController = new PlaidController();
    describe('in regards to normal operation', () => {
        test('should return a default link token', () => {
            // given
            const request = { body: {} }
            const response = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            }

            // when
            plaidController.createLinkToken(request as any, response as any)

            // then
            expect(response.status).toHaveBeenCalledWith(201)
            expect(response.send).toHaveBeenCalledWith({ link_token: 'asd' })
        })
    })
})