import axios, {AxiosError} from 'axios'
import {v4} from 'uuid'
import {StatusCodes} from 'http-status-codes'
import {logInTestUser} from '../helpers'
import {CookieJar} from 'tough-cookie'
import {wrapper} from 'axios-cookiejar-support'
import DataSourceService from '../../src/dataSource/DataSourceService';

const jar = new CookieJar()
const client = wrapper(axios.create({jar, withCredentials: true}))

beforeAll(() => {
    if (process.env.NODE_ENV !== 'development'){
        return
    }
})

describe('Todo resource with some mocked aspects', () => {
    it('returns db error message after repository get failure', async () => {
        try {
            // given
            await DataSourceService.getInstance().initialize()
            let getResponse
            await DataSourceService.getInstance().getDataSource().query('DROP TABLE todos')
            await logInTestUser(client)

            // when
            try {
                getResponse = await client.get(`http://127.0.0.1:8090/api/todos/${v4()}`)
            } catch (error) {
                getResponse = (error as AxiosError).response
            }

            // then
            expect(getResponse?.data.message).toEqual('Error interacting with the database')
            expect(getResponse?.status).toEqual(StatusCodes.INTERNAL_SERVER_ERROR)
        } finally {
            await DataSourceService.getInstance().getDataSource().query('CREATE TABLE todos ( ' +
                'id UUID PRIMARY KEY, ' +
                'task VARCHAR, ' +
                'createdBy VARCHAR ' +
                ')')
            await DataSourceService.getInstance().destroy()
        }
    })
})