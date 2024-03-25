import {StatusCodes} from 'http-status-codes'
import axios from 'axios';
import {wrapper} from 'axios-cookiejar-support'
import {CookieJar} from 'tough-cookie'
import {logInTestUser, logOutUser} from './helpers'

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))

jest.setTimeout(30000 * 2)

describe('Passport resource', () => {
    it('allows test user to log in and out', async () => {
        // when
        const beforeLoginResponse = await client.get(`${process.env.BASE_URL}/api/session-check`)

        // then
        expect(beforeLoginResponse.status).toEqual(StatusCodes.OK)
        expect(beforeLoginResponse.data.sessionActive).toEqual(false)

        // when and then
        await logInTestUser(client)

        // when
        const afterLoginResponse = await client.get(`${process.env.BASE_URL}/api/session-check`)

        // then
        expect(afterLoginResponse.status).toEqual(StatusCodes.OK)
        expect(afterLoginResponse.data.sessionActive).toEqual(true)

        // when and then
        await logOutUser(client)

        // when
        const afterLogoutResponse = await client.get(`${process.env.BASE_URL}/api/session-check`)

				// then
				expect(afterLogoutResponse.status).toEqual(StatusCodes.OK);
				expect(afterLogoutResponse.data.sessionActive).toEqual(false);
		});
});
