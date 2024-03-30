import Todo from '../../src/todos/Todo'
import {StatusCodes} from 'http-status-codes'
import {UUID_REG_EXP} from '../../src/utils'
import axios, {AxiosError} from 'axios'
import {wrapper} from 'axios-cookiejar-support'
import {CookieJar} from 'tough-cookie'
import { authenticateAsAdmin, generateTemporaryUserEmail, logInTestUser, logOutUser } from '../helpers';
import Bank from '../../src/banks/Bank'

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))
const adminJar = new CookieJar()
const admin = wrapper(axios.create({jar: adminJar, withCredentials: true}))

jest.setTimeout(30000 * 2)

describe('Bank resource', () => {
    it('is created, fetched, updated, and deleted', async () => {
        // given
        await authenticateAsAdmin(client)
        const userId: string = (
            await client.get(`${process.env.BASE_URL}/api/users?email=${process.env.ADMIN_EMAIL}`)
        ).data.id

        // given
        const bank: Bank = new Bank('the accessToken',  userId)
        const updateBank: Bank = new Bank('the updated accessToken', userId)

        // when
        const postResponse = await client.post(`${process.env.BASE_URL}/api/banks`, bank)

        // then
        expect(postResponse.status).toEqual(StatusCodes.CREATED)
        const postMessage = postResponse.data
        expect(postMessage.id).toMatch(UUID_REG_EXP)
        expect(postMessage.accessToken).toEqual('the accessToken')
        expect(postMessage.owner).toEqual(userId)

        // when
        const id = postMessage.id
        const getResponse = await client.get(`${process.env.BASE_URL}/api/banks/${id}`)

        // then
        expect(getResponse.status).toEqual(StatusCodes.OK)
        const getMessage = getResponse.data
        expect(getMessage.id).toEqual(id)
        expect(getMessage.accessToken).toEqual('the accessToken')
        expect(getMessage.owner).toEqual(userId)

        // when
        const updateResponse = await client.put(
            `${process.env.BASE_URL}/api/banks/${id}`,
            updateBank
        )

        // then
        expect(updateResponse.status).toEqual(StatusCodes.OK)
        let updateMessage = updateResponse.data
        expect(updateMessage.id).toEqual(id)
        expect(updateMessage.accessToken).toEqual('the updated accessToken')
        expect(updateMessage.owner).toEqual(userId)

        // when
        const getAfterUpdateResponse = await client.get(
            `${process.env.BASE_URL}/api/banks/${id}`
        )

        // then
        expect(getAfterUpdateResponse.status).toEqual(StatusCodes.OK)
        const getAfterUpdateMessage = getAfterUpdateResponse.data
        expect(getAfterUpdateMessage.id).toEqual(id)
        expect(getAfterUpdateMessage.accessToken).toEqual('the updated accessToken')
        expect(getAfterUpdateMessage.owner).toEqual(userId)

        // when
        const deleteResponse = await client.delete(
            `${process.env.BASE_URL}/api/banks/${id}`
        )

        // then
        expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT)

        // when
        let getAfterDeleteResponse

        try {
            getAfterDeleteResponse = await client.get(`${process.env.BASE_URL}/api/banks/${id}`)
        } catch (error) {
            getAfterDeleteResponse = (error as AxiosError).response
        }

        // then
        expect(getAfterDeleteResponse?.status).toEqual(StatusCodes.NOT_FOUND)
        expect(getAfterDeleteResponse?.data.message).toEqual(`Object not found for id=${id}`)

        // cleanup
        await logOutUser(client)
    })
    it('get all returns all banks with owner', async () => {
        // given
        await authenticateAsAdmin(admin)

        const userId: string = (
            await admin.get(`${process.env.BASE_URL}/api/users?email=${process.env.ADMIN_EMAIL}`)
        ).data.id
        const email = generateTemporaryUserEmail()
        const password = 'password'
        const createUserResponse = await axios.post(
            `${process.env.BASE_URL}/api/users`, {
                email: email, password: password, confirmPassword: password
            }
        )
        expect(createUserResponse.status).toEqual(StatusCodes.CREATED)
        const otherUserId = createUserResponse.data.id
        const otherJar = new CookieJar()
        const otherClient = wrapper(axios.create({jar: otherJar, withCredentials: true}))
        await logInTestUser(otherClient, email, password)

        // given
        const firstBank = {accessToken: 'first accessToken'}
        const secondBank= {accessToken: 'second accessToken'}
        const otherBank= {accessToken: 'other accessToken'}
        const firstPostResponse = await admin.post(
            `${process.env.BASE_URL}/api/banks`,
            firstBank
        )
        const secondPostResponse = await admin.post(
            `${process.env.BASE_URL}/api/banks`,
            secondBank
        )
        const otherPostResponse = await admin.post(
            `${process.env.BASE_URL}/api/banks`,
            otherBank
        )
        const otherPutResponse = await admin.put(`${process.env.BASE_URL}/api/banks/${otherPostResponse.data.id}`, {
            ...otherBank,
            owner: otherUserId
        })
        expect(firstPostResponse.status).toEqual(StatusCodes.CREATED)
        expect(secondPostResponse.status).toEqual(StatusCodes.CREATED)
        expect(otherPostResponse.status).toEqual(StatusCodes.CREATED)
        expect(otherPutResponse.status).toEqual(StatusCodes.OK)
        try {
            // when
            const getAllResponse = await admin.get(
                `${process.env.BASE_URL}/api/banks?owner=${userId}`
            )

            // then
            expect(getAllResponse.status).toEqual(StatusCodes.OK)
            let banks = getAllResponse.data.banks

            let foundFirst = banks.find((bank: Bank): boolean => bank.id === firstPostResponse.data.id)
            expect(foundFirst.accessToken).toEqual('first accessToken')
            expect(foundFirst.owner).toEqual(userId)

            let foundSecond = banks.find((bank: Bank): boolean => bank.id === secondPostResponse.data.id)
            expect(foundSecond.accessToken).toEqual('second accessToken')
            expect(foundSecond.owner).toEqual(userId)

            let foundOther = banks.find((bank: Bank): boolean => bank.id === otherPostResponse.data.id)
            expect(foundOther).toEqual(undefined)
        } finally {
            // cleanup
            const firstDeleteResponse = await admin.delete(
                `${process.env.BASE_URL}/api/banks/${firstPostResponse.data.id}`
            )
            const secondDeleteResponse = await admin.delete(
                `${process.env.BASE_URL}/api/banks/${secondPostResponse.data.id}`
            )
            const otherDeleteResponse = await admin.delete(
                `${process.env.BASE_URL}/api/banks/${otherPostResponse.data.id}`
            )
            expect(firstDeleteResponse.status).toEqual(StatusCodes.NO_CONTENT)
            expect(secondDeleteResponse.status).toEqual(StatusCodes.NO_CONTENT)
            expect(otherDeleteResponse.status).toEqual(StatusCodes.NO_CONTENT)
            await logOutUser(admin)
            const otherUserDeleteResponse = await otherClient.delete(
                `${process.env.BASE_URL}/api/users/${otherUserId}`
            )
            expect(otherUserDeleteResponse.status).toEqual(StatusCodes.NO_CONTENT)
        }
    })
})
