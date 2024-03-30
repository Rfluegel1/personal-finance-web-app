import axios, { AxiosError, AxiosInstance } from 'axios';
import {StatusCodes} from 'http-status-codes'
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { v4 } from 'uuid';

async function ensureTestUser(client: AxiosInstance, email: string, password: string) {
    try {
        const jar = new CookieJar()
        const adminClient = wrapper(axios.create({jar, withCredentials: true}))
        await authenticateAsAdmin(adminClient)
        const response = await adminClient.get(`${process.env.BASE_URL}/api/users?email=${email}`)
        return response.data.id
    } catch (error) {
        if ((error as AxiosError)?.response?.status === StatusCodes.NOT_FOUND) {
            const createResponse = await client.post(`${process.env.BASE_URL}/api/users`, {
                email: email, password: password, confirmPassword: password
            })
            expect(createResponse.status).toEqual(StatusCodes.CREATED)
            return createResponse.data.id
        } else {
            throw error
        }
    }
}

export async function logInTestUser(
    client: AxiosInstance,
    email: string = 'cypressdefault@gmail.com',
    password: string = process.env.TEST_USER_PASSWORD as string
) {
    const userId = await ensureTestUser(client, email, password)

    const data = new URLSearchParams()
    data.append('username', email)
    data.append('password', password)
    let logInResponse = await client.post(`${process.env.BASE_URL}/api/login`, data, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    expect(logInResponse.status).toEqual(StatusCodes.OK)
    return userId
}

export async function logOutUser(client: AxiosInstance) {
    const logOutResponse = await client.post(`${process.env.BASE_URL}/api/logout`)

    expect(logOutResponse.status).toEqual(StatusCodes.OK)
    return logOutResponse
}

export async function authenticateAsAdmin(client: AxiosInstance) {
    const data = new URLSearchParams()
    data.append('username', process.env.ADMIN_EMAIL as string)
    data.append('password', process.env.ADMIN_PASSWORD as string)
    let logInResponse = await client.post(`${process.env.BASE_URL}/api/login`, data, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    expect(logInResponse.status).toEqual(StatusCodes.OK)
}

export function generateTemporaryUserEmail() {
    return `test${v4()}@expresswebapptemplate.com`
}