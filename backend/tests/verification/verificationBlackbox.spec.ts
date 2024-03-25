import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';
import { authenticateAsAdmin, generateTemporaryUserEmail, logInTestUser, logOutUser } from '../helpers';
import { StatusCodes } from 'http-status-codes';
import { UUID_REG_EXP } from '../../src/utils';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));
const adminJar = new CookieJar();
const admin = wrapper(axios.create({ jar: adminJar, withCredentials: true }));

jest.setTimeout(30000 * 2);

describe('Verification resource', () => {
	it('claims to have successfully sent password reset email and token verification works', async () => {
		// given
		let userId;
		let passwordResetToken;
		let passwordHash;

		await authenticateAsAdmin(admin);
		try {
			const email = generateTemporaryUserEmail();
			const createResponse = await client.post(`${process.env.BASE_URL}/api/users`, {
				email: email,
				password: 'password',
				confirmPassword: 'password'
			});
			userId = createResponse.data.id;

			// when
			const getBeforeResponse = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getBeforeResponse.status).toEqual(StatusCodes.OK);
			expect(getBeforeResponse.data.passwordReset.token).toEqual('');
			expect(getBeforeResponse.data.passwordHash).not.toBeNull();
			passwordHash = getBeforeResponse.data.passwordHash;

			// when
			const response = await client.post(`${process.env.BASE_URL}/api/request-password-reset`, {
				email: email
			});

			// then
			expect(response.status).toEqual(StatusCodes.CREATED);

			// when
			const getResponse = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getResponse.status).toEqual(StatusCodes.OK);
			expect(getResponse.data.passwordReset.token).toMatch(UUID_REG_EXP);
			passwordResetToken = getResponse.data.passwordReset.token;

			// when
			const resetResponse = await client.put(`${process.env.BASE_URL}/api/reset-password?token=${passwordResetToken}`, {
				password: 'newPassword',
				confirmPassword: 'newPassword'
			});

			// then
			expect(resetResponse.status).toEqual(StatusCodes.OK);

			//when
			const getAfterVerification = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getAfterVerification.status).toEqual(StatusCodes.OK);
			expect(getAfterVerification.data.passwordHash).not.toBeNull();
			expect(getAfterVerification.data.passwordHash).not.toEqual(passwordHash);
			expect(getAfterVerification.data.passwordReset.token).toEqual('');
		} finally {
			// cleanup
			await logOutUser(client);
			const deleteResponse = await admin.delete(`${process.env.BASE_URL}/api/users/${userId}`);
			expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT);
			await logOutUser(admin);
		}
	});
	it('claims to have successfully sent verification email and token verification works', async () => {
		// given
		let userId;
		let emailVerificationToken;
		await authenticateAsAdmin(admin);
		try {
			userId = await logInTestUser(
				client,
				generateTemporaryUserEmail(),
				'password'
			);

			// when
			const getBeforeVerification = await client.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getBeforeVerification.status).toEqual(StatusCodes.OK);
			expect(getBeforeVerification.data.isVerified).toEqual(false);

			// when
			const response = await client.post(`${process.env.BASE_URL}/api/send-verification-email`);

			// then
			expect(response.status).toEqual(StatusCodes.CREATED);

			// when
			const getResponse = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getResponse.status).toEqual(StatusCodes.OK);
			emailVerificationToken = getResponse.data.emailVerification.token;

			// when
			const verifyResponse = await client.get(`${process.env.BASE_URL}/api/verify-email?token=${emailVerificationToken}`);

			// then
			expect(verifyResponse.status).toEqual(StatusCodes.OK);

			// when
			const getAfterVerification = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getAfterVerification.status).toEqual(StatusCodes.OK);
			expect(getAfterVerification.data.isVerified).toEqual(true);
			expect(getAfterVerification.data.emailVerification.token).toEqual('');
		} finally {
			// cleanup
			await logOutUser(client);
			const deleteResponse = await admin.delete(`${process.env.BASE_URL}/api/users/${userId}`);
			expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT);
			await logOutUser(admin);
		}
	});
	it('claims to have successfully sent "update email" email and token verification works', async () => {
		// given
		let userId;
		let emailUpdateToken;
		await authenticateAsAdmin(admin);
		try {
			const originalEmail = generateTemporaryUserEmail();
			userId = await logInTestUser(
				client,
				originalEmail,
				'password'
			);

			// when
			const getBeforeVerification = await client.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getBeforeVerification.status).toEqual(StatusCodes.OK);
			expect(getBeforeVerification.data.emailUpdate).toEqual(undefined);

			// when
			const newEmail = generateTemporaryUserEmail();
			const response = await client.post(`${process.env.BASE_URL}/api/request-email-change`, {
				email: newEmail
			});

			// then
			expect(response.status).toEqual(StatusCodes.CREATED);

			// when
			const getResponse = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getResponse.status).toEqual(StatusCodes.OK);
			expect(getResponse.data.emailUpdate.token).toMatch(UUID_REG_EXP);
			expect(getResponse.data.pendingEmail).toEqual(newEmail);
			expect(getResponse.data.email).toEqual(originalEmail);
			expect(getResponse.data.isVerified).toEqual(false);
			emailUpdateToken = getResponse.data.emailUpdate.token;

			// when
			const verifyResponse = await client.get(`${process.env.BASE_URL}/api/update-email?token=${emailUpdateToken}`);

			// then
			expect(verifyResponse.status).toEqual(StatusCodes.OK);

			// when
			const getAfterVerification = await admin.get(`${process.env.BASE_URL}/api/users/${userId}`);

			// then
			expect(getAfterVerification.status).toEqual(StatusCodes.OK);
			expect(getAfterVerification.data.isVerified).toEqual(true);
			expect(getAfterVerification.data.emailUpdate.token).toEqual('');
			expect(getAfterVerification.data.pendingEmail).toEqual('');
			expect(getAfterVerification.data.email).toEqual(newEmail);
		} finally {
			// cleanup
			await logOutUser(client);
			const deleteResponse = await admin.delete(`${process.env.BASE_URL}/api/users/${userId}`);
			expect(deleteResponse.status).toEqual(StatusCodes.NO_CONTENT);
			await logOutUser(admin);
		}
	});
});