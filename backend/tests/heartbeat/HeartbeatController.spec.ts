import HeartbeatController from '../../src/heartbeat/HeartbeatController'

jest.mock('../../src/logger', () => ({
    getLogger: jest.fn(() => {
        return {
            info: jest.fn()
        }
    })
}))
describe('Heartbeat function', () => {
    let heartbeatController: HeartbeatController = new HeartbeatController()

    it('should return version number', () => {
        const request: any = {}
        const response: any = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        }

        heartbeatController.heartbeat(request, response)

        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.send).toHaveBeenCalledWith({version: '1.0.0'})
    })
})
