import {StatusCodes} from 'http-status-codes'
import {expect} from '@playwright/test'

import dotenv from 'dotenv';
import { CookieJar } from 'tough-cookie';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
async function ensureTestUser(client, email, password) {
    try {
        const jar = new CookieJar()
        const adminClient = wrapper(axios.create({jar, withCredentials: true}))
        await authenticateAsAdmin(adminClient)
        return (await adminClient.get(`${process.env.BASE_URL}/api/users?email=${email}`)).data.id
    } catch (error) {
        if ((error)?.response?.status === StatusCodes.NOT_FOUND) {
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

export async function logInTestUserWithClient(
    client,
    email = 'cypressdefault@gmail.com',
    password = process.env.TEST_USER_PASSWORD
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

export async function logOutUserWithClient(client) {
    const logOutResponse = await client.post(`${process.env.BASE_URL}/api/logout`)

    expect(logOutResponse.status).toEqual(StatusCodes.OK)
    return logOutResponse
}

export async function authenticateAsAdmin(client) {
    const data = new URLSearchParams()
    data.append('username', process.env.ADMIN_EMAIL)
    data.append('password', process.env.ADMIN_PASSWORD)
    let logInResponse = await client.post(`${process.env.BASE_URL}/api/login`, data, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    })
    expect(logInResponse.status).toEqual(StatusCodes.OK)
}