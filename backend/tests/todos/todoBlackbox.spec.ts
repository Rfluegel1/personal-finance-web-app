import Todo from '../../src/todos/Todo'
import {StatusCodes} from 'http-status-codes'
import {UUID_REG_EXP} from '../../src/utils'
import axios, {AxiosError} from 'axios'
import {wrapper} from 'axios-cookiejar-support'
import {CookieJar} from 'tough-cookie'
import { authenticateAsAdmin, generateTemporaryUserEmail, logInTestUser, logOutUser } from '../helpers';

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))
const adminJar = new CookieJar()
const admin = wrapper(axios.create({jar: adminJar, withCredentials: true}))

jest.setTimeout(30000 * 2)

describe('Todo resource', () => {
    it('is created, fetched, updated, and deleted', async () => {
        // given
        await logInTestUser(client)
        const userId: string = (
          await client.get(`${process.env.BASE_URL}/api/users?email=cypressdefault@gmail.com`)
        ).data.id

        // given
        const todo: Todo = new Todo('the task', userId)
        const updateTodo: Todo = new Todo('the updated task', userId)

        // when
        const postResponse = await client.post(`${process.env.BASE_URL}/api/todos`, todo)

        // then
        expect(postResponse.status).toEqual(StatusCodes.CREATED)
        const postMessage = postResponse.data.message
        expect(postMessage.id).toMatch(UUID_REG_EXP)
        expect(postMessage.task).toEqual('the task')
        expect(postMessage.createdBy).toEqual(userId)

        // when
        const id = postMessage.id
        const getResponse = await client.get(`${process.env.BASE_URL}/api/todos/${id}`)

        // then
        expect(getResponse.status).toEqual(StatusCodes.OK)
        const getMessage = getResponse.data.message
        expect(getMessage.id).toEqual(id)
        expect(getMessage.task).toEqual('the task')
        expect(getMessage.createdBy).toEqual(userId)

        // when
        const updateResponse = await client.put(
            `${process.env.BASE_URL}/api/todos/${id}`,
            updateTodo
        )

        // then
        expect(updateResponse.status).toEqual(StatusCodes.OK)
        let updateMessage = updateResponse.data.message
        expect(updateMessage.id).toEqual(id)
        expect(updateMessage.task).toEqual('the updated task')
        expect(updateMessage.createdBy).toEqual(userId)

        // when
        const getAfterUpdateResponse = await client.get(
            `${process.env.BASE_URL}/api/todos/${id}`
        )

        // then
        expect(getAfterUpdateResponse.status).toEqual(StatusCodes.OK)
        const getAfterUpdateMessage = getAfterUpdateResponse.data.message
        expect(getAfterUpdateMessage.id).toEqual(id)
        expect(getAfterUpdateMessage.task).toEqual('the updated task')
        expect(getAfterUpdateMessage.createdBy).toEqual(userId)

        // when
        const deleteResponse = await client.delete(
            `${process.env.BASE_URL}/api/todos/${id}`
        )

        // then
        expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT)

        // when
        let getAfterDeleteResponse

        try {
            getAfterDeleteResponse = await client.get(`${process.env.BASE_URL}/api/todos/${id}`)
        } catch (error) {
            getAfterDeleteResponse = (error as AxiosError).response
        }

        // then
        expect(getAfterDeleteResponse?.status).toEqual(StatusCodes.NOT_FOUND)
        expect(getAfterDeleteResponse?.data.message).toEqual(`Object not found for id=${id}`)

        // cleanup
        await logOutUser(client)
    })
    it('get all returns all posts createdBy the authenticated user', async () => {
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
        const firstTodo = {task: 'first task'}
        const secondTodo= {task: 'second task'}
        const otherTodo= {task: 'other task'}
        const firstPostResponse = await admin.post(
            `${process.env.BASE_URL}/api/todos`,
            firstTodo
        )
        const secondPostResponse = await admin.post(
            `${process.env.BASE_URL}/api/todos`,
            secondTodo
        )
        const otherPostResponse = await otherClient.post(
            `${process.env.BASE_URL}/api/todos`,
            otherTodo
        )
        expect(firstPostResponse.status).toEqual(StatusCodes.CREATED)
        expect(secondPostResponse.status).toEqual(StatusCodes.CREATED)
        expect(otherPostResponse.status).toEqual(StatusCodes.CREATED)
        try {
            // when
            const getAllResponse = await admin.get(
                `${process.env.BASE_URL}/api/todos`
            )

            // then
            expect(getAllResponse.status).toEqual(StatusCodes.OK)
            let todos = getAllResponse.data.message

            let foundFirst = todos.find((todo: Todo): boolean => todo.id === firstPostResponse.data.message.id)
            expect(foundFirst.task).toEqual('first task')
            expect(foundFirst.createdBy).toEqual(userId)

            let foundSecond = todos.find((todo: Todo): boolean => todo.id === secondPostResponse.data.message.id)
            expect(foundSecond.task).toEqual('second task')
            expect(foundSecond.createdBy).toEqual(userId)

            let foundOther = todos.find((todo: Todo): boolean => todo.id === otherPostResponse.data.message.id)
            expect(foundOther).toEqual(undefined)
        } finally {
            // cleanup
            const firstDeleteResponse = await admin.delete(
                `${process.env.BASE_URL}/api/todos/${firstPostResponse.data.message.id}`
            )
            const secondDeleteResponse = await admin.delete(
                `${process.env.BASE_URL}/api/todos/${secondPostResponse.data.message.id}`
            )
            const otherDeleteResponse = await otherClient.delete(
                `${process.env.BASE_URL}/api/todos/${otherPostResponse.data.message.id}`
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
