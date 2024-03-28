import {StatusCodes} from 'http-status-codes'
import axios from 'axios'
import {logInTestUser} from '../helpers'
import {CookieJar} from 'tough-cookie'
import {wrapper} from 'axios-cookiejar-support'

jest.setTimeout(30000 * 2)

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))

describe('Plaid resource', () => {
    test('should create a link token', async () => {
        // when
        const response = await axios.post(`${process.env.BASE_URL}/api/create_link_token`)

        // then
        expect(response.status).toBe(StatusCodes.CREATED)
        expect(response.data.link_token).toBeTruthy()
    })

    test('should exchange a public token', async () => {
        if (process.env.NODE_ENV === 'development') {
            // given
            await logInTestUser(client)
            let huntingtonBank = 'ins_21'
            const response = await axios.post('https://sandbox.plaid.com/sandbox/public_token/create', {
                'client_id': '64fbc6e226a0f70017bcd313',
                'secret': process.env.PLAID_SECRET,
                'institution_id': huntingtonBank,
                'initial_products': [
                    'auth'
                ]
            })
            const publicToken = response.data.public_token

            // when
            const exchangeResponse = await client.post(`${process.env.BASE_URL}/api/create_access_token`, {public_token: publicToken})

            // then
            expect(exchangeResponse.status).toBe(StatusCodes.CREATED)
            expect(exchangeResponse.data.access_token).toBeTruthy()
        }
    })
})
