import {StatusCodes} from 'http-status-codes'
import axios from 'axios'
import {logInTestUser, logOutUser} from '../helpers'
import {CookieJar} from 'tough-cookie'
import {wrapper} from 'axios-cookiejar-support'

jest.setTimeout(30000 * 100)

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))

describe('Plaid resource', () => {
    test('should create a link token', async () => {
        // given
        await logInTestUser(client)

        // when
        const response = await client.post(`${process.env.BASE_URL}/api/create_link_token`)

        // then
        expect(response.status).toBe(StatusCodes.CREATED)
        expect(response.data.link_token).toBeTruthy()

        // cleanup
        await logOutUser(client)
    })
})
