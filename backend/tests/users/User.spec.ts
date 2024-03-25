import { UUID_REG_EXP } from '../../src/utils';
import User from '../../src/users/User';
import bcrypt from 'bcrypt';

describe('User object', () => {
	it('default constructor sets default values', () => {
		// when
		const result: User = new User();
		// then
		expect(result.id).toMatch(UUID_REG_EXP);
		expect(result.email).toEqual('');
		expect(result.passwordHash).toEqual('');
		expect(result.isVerified).toEqual(false);
		expect(result.emailVerification).toEqual({ token: '', expiration: '' });
		expect(result.passwordReset).toEqual({ token: '', expiration: '' });
		expect(result.emailUpdate).toEqual({ token: '', expiration: '' });
		expect(result.role).toEqual('user');
		expect(result.pendingEmail).toEqual('');
	});
	it('values constructor sets values', () => {
		// when
		const result: User = new User('the email', 'the passwordHash', true, {
			token: 'emailVerificationToken',
			expiration: 'emailVerificationExpiration'
		}, 'role', { token: 'passwordResetToken', expiration: 'passwordResetExpiration' }, {
			token: 'emailUpdateToken',
			expiration: 'emailUpdateExpiration'
		}, 'pendingEmail');
		// then
		expect(result.id).toMatch(UUID_REG_EXP);
		expect(result.email).toEqual('the email');
		expect(result.passwordHash).toEqual('the passwordHash');
		expect(result.isVerified).toEqual(true);
		expect(result.emailVerification).toEqual({
			token: 'emailVerificationToken',
			expiration: 'emailVerificationExpiration'
		});
		expect(result.passwordReset).toEqual({ token: 'passwordResetToken', expiration: 'passwordResetExpiration' });
		expect(result.emailUpdate).toEqual({ token: 'emailUpdateToken', expiration: 'emailUpdateExpiration' });
		expect(result.role).toEqual('role');
		expect(result.pendingEmail).toEqual('pendingEmail');
	});
	it('compares input password to password hash', async () => {
		// given
		const hashedPassword = await bcrypt.hash('password', 10);
		// when
		const result = await new User('', hashedPassword).isValidPassword('password');
		// then
		expect(result).toEqual(true);
	});
});
