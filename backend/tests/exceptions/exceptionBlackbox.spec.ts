import axios, { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { authenticateAsAdmin, generateTemporaryUserEmail, logInTestUser, logOutUser } from '../helpers';
import Todo from '../../src/todos/Todo';

let client: any
describe('Exception Handling', () => {

	beforeEach(() => {
		const jar = new CookieJar()
		client = wrapper(axios.create({jar, withCredentials: true}))
	})

	it('throws unauthorized exception when credentials are invalid', async () => {
		let logInResponse;
		const email: string = 'cypressdefault@gmail.com';
		const password: string = 'wrongPassword';

		const data = new URLSearchParams();
		data.append('username', email);
		data.append('password', password);
		try {
			logInResponse = await client.post(`${process.env.BASE_URL}/api/login`, data, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
			});
		} catch (error) {
			logInResponse = (error as AxiosError).response
		}
		expect(logInResponse?.status).toEqual(StatusCodes.UNAUTHORIZED)
	});

	it('should throw error when password and confirmPassword do not match', async () => {
		//given
		const email = generateTemporaryUserEmail();
		let postResponse;

		// when
		try {
			postResponse = await client.post(`${process.env.BASE_URL}/api/users`, {
				email: email, password: 'password', confirmPassword: 'other'
			});
		} catch (e) {
			postResponse = (e as AxiosError).response;
		}
		// then
		expect(postResponse?.status).toEqual(StatusCodes.BAD_REQUEST);
		expect(postResponse?.data.message).toEqual('"confirmPassword" must match "password"');
	});

	it('should throw error when email is already taken', async () => {
		const email = generateTemporaryUserEmail();
		let userId;
		try {
			userId = (await client.post(`${process.env.BASE_URL}/api/users`, {
				email: email, password: 'password', confirmPassword: 'password'
			})).data.id;
			let secondResponse;
			try {
				secondResponse = await client.post(`${process.env.BASE_URL}/api/users`, {
					email: email, password: 'password', confirmPassword: 'password'
				});
			} catch (e) {
				secondResponse = (e as AxiosError).response;
			}
			expect(secondResponse?.status).toEqual(StatusCodes.CONFLICT);
			expect(secondResponse?.data.message).toEqual('Duplicate key value violates unique constraint=users_email_key');
		} finally {
			await authenticateAsAdmin(client);
			await client.delete(`${process.env.BASE_URL}/api/users/${userId}`);
		}
	});

	it('non uuid returns bad request and info', async () => {
		// given
		await logInTestUser(client)

		// when
		let getResponse
		try {
			getResponse = await client.get(`${process.env.BASE_URL}/api/todos/undefined`)
		} catch (error) {
			getResponse = (error as AxiosError).response
		}
		// then
		expect(getResponse?.status).toEqual(StatusCodes.BAD_REQUEST)
		expect(getResponse?.data.message).toEqual('"id" must be a valid GUID')

		// cleanup
		await logOutUser(client)
	})

	it('create should be disabled when auth session not found', async () => {
		// given
		const todo: Todo = new Todo('the task', 'the createdBy')
		let postResponse

		// when
		try {
			postResponse = await axios.post(`${process.env.BASE_URL}/api/todos`, todo)
		} catch (e) {
			postResponse = (e as AxiosError).response
		}

		// then
		expect(postResponse?.status).toEqual(StatusCodes.UNAUTHORIZED)
		expect(postResponse?.data.message).toEqual(
			'Unauthorized: You must be logged in to perform action=create todo.'
		)
	})
})