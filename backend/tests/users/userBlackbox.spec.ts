import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import { UUID_REG_EXP } from '../../src/utils';
import { AxiosError } from 'axios';
import { authenticateAsAdmin, generateTemporaryUserEmail, logInTestUser, logOutUser } from '../helpers';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { v4 } from 'uuid';

jest.setTimeout(30000 * 2);

let client: any;

beforeEach(() => {
	const jar = new CookieJar();
	client = wrapper(axios.create({ jar, withCredentials: true }));
});

describe('User resource', () => {
	it('should create, get, and delete', async () => {
		// given
		let id;
		const email = generateTemporaryUserEmail();
		const password = 'password';

		// when
		const postResponse = await axios.post(`${process.env.BASE_URL}/api/users`, {
			email: email, password: password, confirmPassword: password
		});

		// then
		expect(postResponse.status).toEqual(StatusCodes.CREATED);
		let postData = postResponse.data;
		expect(postData.id).toMatch(UUID_REG_EXP);
		expect(postData.email).toEqual(email);
		expect(postData.password).toEqual(undefined);
		expect(postData.passwordHash).toEqual(undefined);
		expect(postData.isVerified).toEqual(false);
		expect(postData.emailVerificationToken).toEqual(undefined);

		// and
		id = postData.id;

		// when
		await logInTestUser(client, email, password);
		const getResponse = await client.get(`${process.env.BASE_URL}/api/users/${id}`);

		// then
		expect(getResponse.status).toEqual(StatusCodes.OK);
		let getData = getResponse.data;
		expect(getData.id).toEqual(id);
		expect(getData.email).toEqual(email);
		expect(getData.password).toEqual(undefined);
		expect(getData.passwordHash).toEqual(undefined);
		expect(getData.isVerified).toEqual(false);
		expect(getData.emailVerificationToken).toEqual(undefined);

		// when
		const getByEmailResponse = await client.get(
			`${process.env.BASE_URL}/api/users?email=${email}`
		);

		// then
		expect(getByEmailResponse.status).toEqual(StatusCodes.OK);
		let getByEmailData = getByEmailResponse.data;
		expect(getByEmailData.id).toEqual(id);
		expect(getByEmailData.email).toEqual(email);
		expect(getByEmailData.password).toEqual(undefined);
		expect(getByEmailData.passwordHash).toEqual(undefined);
		expect(getByEmailData.isVerified).toEqual(false);
		expect(getByEmailData.emailVerificationToken).toEqual(undefined);

		// when
		const deleteResponse = await client.delete(`${process.env.BASE_URL}/api/users/${id}`);

		// then
		expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT);

		// when
		let getAfterDeleteResponse;

		try {
			getAfterDeleteResponse = await client.get(`${process.env.BASE_URL}/api/users/${id}`);
		} catch (error) {
			getAfterDeleteResponse = (error as AxiosError).response;
		}

		// then
		expect(getAfterDeleteResponse?.status).toEqual(StatusCodes.NOT_FOUND);
		expect(getAfterDeleteResponse?.data.message).toEqual(`Object not found for id=${id}`);
	});

	it('should allow admin user to delete any user', async () => {
		// given
		let userId;
		const email = generateTemporaryUserEmail();
		const password = 'password';
		await authenticateAsAdmin(client);
		const postResponse = await axios.post(`${process.env.BASE_URL}/api/users`, {
			email: email, password: password, confirmPassword: password
		});

		//expect
		expect(postResponse.status).toEqual(StatusCodes.CREATED);
		userId = postResponse.data.id;

		// when
		const deleteResponse = await client.delete(`${process.env.BASE_URL}/api/users/${userId}`);

		// then
		expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT);
	});

	it('should allow admin to view and update all fields of any user', async () => {
		// given
		let id;
		const email = generateTemporaryUserEmail();
		const updatedEmail = generateTemporaryUserEmail();
		const password = 'password';
		const updatedPassword = 'newPassword';
		const emailVerificationToken = v4();
		const emailVerificationExpiration = '2022-01-01T00:00:00.000Z';
		const passwordResetToken = v4();
		const passwordResetExpiration = '2024-01-01T00:00:00.000Z';
		const emailUpdateToken = v4();
		const emailUpdateExpiration = '2023-01-01T00:00:00.000Z';
		const pendingEmail = generateTemporaryUserEmail();

		await authenticateAsAdmin(client);
		try {
			// when
			const postResponse = await axios.post(`${process.env.BASE_URL}/api/users`, {
				email: email, password: password, confirmPassword: password
			});

			// then
			expect(postResponse.status).toEqual(StatusCodes.CREATED);
			id = postResponse.data.id;

			// when
			const getResponse = await client.get(`${process.env.BASE_URL}/api/users/${id}`);

			// then
			expect(getResponse.status).toEqual(StatusCodes.OK);
			const getData = getResponse.data;
			expect(getData.id).toEqual(id);
			expect(getData.email).toEqual(email);
			expect(getData.password).toEqual(undefined);
			expect(getData.passwordHash).not.toEqual(undefined);
			expect(getData.isVerified).toEqual(false);
			expect(getData.emailVerification.token).not.toEqual(undefined);
			expect(getData.emailVerification.expiration).not.toEqual(undefined);
			expect(getData.passwordReset.token).toEqual('');
			expect(getData.passwordReset.expiration).toEqual('');
			expect(getData.role).toEqual('user');
			expect(getData.emailUpdate.token).toEqual('');
			expect(getData.emailUpdate.expiration).toEqual('');
			expect(getData.pendingEmail).toEqual('');

			// when
			const updateResponse = await client.put(`${process.env.BASE_URL}/api/users/${id}`, {
				email: updatedEmail,
				password: updatedPassword,
				confirmPassword: updatedPassword,
				isVerified: true,
				emailVerification: { token: emailVerificationToken, expiration: emailVerificationExpiration },
				passwordReset: { token: passwordResetToken, expiration: passwordResetExpiration },
				role: 'anything',
				emailUpdate: { token: emailUpdateToken, expiration: emailUpdateExpiration },
				pendingEmail: pendingEmail
			});

			// then
			expect(updateResponse.status).toEqual(StatusCodes.OK);
			const updateData = updateResponse.data;
			expect(updateData.id).toEqual(id);
			expect(updateData.email).toEqual(updatedEmail);
			expect(updateData.password).toEqual(undefined);
			expect(updateData.passwordHash).not.toEqual(undefined);
			expect(updateData.isVerified).toEqual(true);
			expect(updateData.emailVerification.token).toEqual(emailVerificationToken);
			expect(updateData.emailVerification.expiration).toEqual(emailVerificationExpiration);
			expect(updateData.passwordReset.token).toEqual(passwordResetToken);
			expect(updateData.passwordReset.expiration).toEqual(passwordResetExpiration);
			expect(updateData.role).toEqual('anything');
			expect(updateData.emailUpdate.token).toEqual(emailUpdateToken);
			expect(updateData.emailUpdate.expiration).toEqual(emailUpdateExpiration);
			expect(updateData.pendingEmail).toEqual(pendingEmail);

			// when
			const getAfterUpdateResponse = await client.get(`${process.env.BASE_URL}/api/users/${id}`);

			// then
			expect(getAfterUpdateResponse.status).toEqual(StatusCodes.OK);
			const getAfterUpdateData = getAfterUpdateResponse.data;
			expect(getAfterUpdateData.id).toEqual(id);
			expect(getAfterUpdateData.email).toEqual(updatedEmail);
			expect(getAfterUpdateData.password).toEqual(undefined);
			expect(getAfterUpdateData.passwordHash).not.toEqual(undefined);
			expect(getAfterUpdateData.isVerified).toEqual(true);
			expect(getAfterUpdateData.emailVerification.token).toEqual(emailVerificationToken);
			expect(getAfterUpdateData.emailVerification.expiration).toEqual(emailVerificationExpiration);
			expect(getAfterUpdateData.passwordReset.token).toEqual(passwordResetToken);
			expect(getAfterUpdateData.passwordReset.expiration).toEqual(passwordResetExpiration);
			expect(getAfterUpdateData.role).toEqual('anything');
			expect(getAfterUpdateData.emailUpdate.token).toEqual(emailUpdateToken);
			expect(getAfterUpdateData.emailUpdate.expiration).toEqual(emailUpdateExpiration);
			expect(getAfterUpdateData.pendingEmail).toEqual(pendingEmail);
		} finally {
			const deleteResponse = await client.delete(`${process.env.BASE_URL}/api/users/${id}`);
			expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT);
			await logOutUser(client);
		}
	});
});
