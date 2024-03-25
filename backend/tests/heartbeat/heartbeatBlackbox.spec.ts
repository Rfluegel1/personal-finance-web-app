import {StatusCodes} from 'http-status-codes'
import axios from 'axios'

jest.setTimeout(30000 * 2)
describe('Heartbeat resource', () => {
    it('should return version of the application', async () => {
        // when
        const getResponse = await axios.get(`${process.env.BASE_URL}/api/heartbeat`)

        // then
        expect(getResponse.status).toEqual(StatusCodes.OK)
        let getData = getResponse.data
        expect(getData.version).toEqual('1.0.0')
    })
})
