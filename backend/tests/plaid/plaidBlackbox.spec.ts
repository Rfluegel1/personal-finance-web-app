import {StatusCodes} from 'http-status-codes'
import axios from 'axios'
import {logInTestUser} from '../helpers'
import {CookieJar} from 'tough-cookie'
import {wrapper} from 'axios-cookiejar-support'
import {plaidClient} from '../../src/plaid/PlaidConfiguration'
import {Products, SandboxPublicTokenCreateRequest} from 'plaid'

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
            let sandboxPublicTokenCreateRequest: SandboxPublicTokenCreateRequest = {
                institution_id: huntingtonBank,
                initial_products: [Products.Auth]
            }
            const response = await plaidClient.sandboxPublicTokenCreate(sandboxPublicTokenCreateRequest)
            const publicToken = response.data.public_token

            // when
            const exchangeResponse = await client.post(`${process.env.BASE_URL}/api/create_access_token`, {public_token: publicToken})

            // then
            expect(exchangeResponse.status).toBe(StatusCodes.CREATED)
            expect(exchangeResponse.data.access_token).toBeTruthy()
        }
    })
})
