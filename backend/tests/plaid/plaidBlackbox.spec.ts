import {StatusCodes} from 'http-status-codes'
import axios from 'axios'

jest.setTimeout(30000 * 2)

describe('Plaid resource', () => {
    test('should create a link token', async () => {
        // when
        const response = await axios.post(`${process.env.BASE_URL}/api/create_link_token`)

        // then
        expect(response.status).toBe(StatusCodes.CREATED)
        expect(response.data.link_token).toBeTruthy()
    })
})
