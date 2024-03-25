import { v4 } from 'uuid';
import { transporter } from '../nodemailerConfig';
import UserRepository from '../users/UserRepository';
import { getLogger } from '../logger';
import bcrypt from 'bcrypt';
import User from '../users/User';
import { NotFoundException } from '../exceptions/NotFoundException';

export default class VerificationService {
	userRepository = new UserRepository();

	async sendVerificationEmail(userId: string) {
		const user = await this.userRepository.getUser(userId);
		const token = v4();
		const expiration = new Date(Date.now() + 1000 * 60 * 60).toISOString();
		user.emailVerification.token = token;
		user.emailVerification.expiration = expiration;
		await this.userRepository.updateUser(user);

		const verificationUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;

		let mailOptions = {
			from: '"Express Web App Template" <noreply@expresswebapptemplate.com>',
			to: user.email,
			subject: 'Email Verification',
			text: `Please click on the following link to verify your email: ${verificationUrl}`
		};

		if (!user.email.includes('expresswebapptemplate.com')) {
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					getLogger().error(error);
				}
				getLogger().info(`Email verification message sent for email=${user.email}`);
			});
		}
	}

	async verifyEmail(token: string) {
		const user = await this.userRepository.getUserByEmailVerificationToken(token);
		if (user.emailVerification.expiration < new Date().toISOString()) {
			throw new Error('Token has expired');
		}
		user.isVerified = true;
		user.emailVerification.token= '';
		user.emailVerification.expiration= '';
		await this.userRepository.updateUser(user);
	}

	async requestPasswordReset(email: string) {
		const id = v4();
		let user: User;
		try {
			user = await this.userRepository.getUserByEmail(email);
		} catch (e) {
			if (e instanceof NotFoundException) {
				getLogger().error(e.message);
				return;
			}
			throw e
		}
		user.passwordReset.token = id;
		user.passwordReset.expiration = new Date(Date.now() + 1000 * 60 * 60).toISOString();
		await this.userRepository.updateUser(user);

		const verificationUrl = `${process.env.BASE_URL}/reset-password?token=${id}`;

		let mailOptions = {
			from: '"Express Web App Template" <noreply@expresswebapptemplate.com>',
			to: user.email,
			subject: 'Password Reset',
			text: `Please click on the following link to reset your password: ${verificationUrl}`
		};
		if (!user.email.includes('expresswebapptemplate.com')) {
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					getLogger().error(error);
				}
				getLogger().info(`Email verification message sent for email=${user.email}`);
			});
		}
	}

	async resetPassword(token: string, password: string) {
		const user = await this.userRepository.getUserByPasswordResetToken(token);
		if (user.passwordReset.expiration < new Date().toISOString()) {
			throw new Error('Token has expired');
		}
		let passwordHash;
		if (password) {
			passwordHash = await bcrypt.hash(password, 10);
		}
		user.passwordHash = passwordHash;
		user.passwordReset.token = '';
		user.passwordReset.expiration = '';
		await this.userRepository.updateUser(user);
	}

	async requestEmailChange(userId: string, newEmail: string) {
		const user = await this.userRepository.getUser(userId);
		const token = v4();
		user.emailUpdate.token = token;
		user.emailUpdate.expiration = new Date(Date.now() + 1000 * 60 * 60).toISOString();
		user.pendingEmail = newEmail;
		await this.userRepository.updateUser(user);

		const verificationUrl = `${process.env.BASE_URL}/api/update-email?token=${token}`;

		let mailOptions = {
			from: '"Express Web App Template" <noreply@expresswebapptemplate.com>',
			to: user.pendingEmail,
			subject: 'Email Update',
			text: `Please click on the following link to update your email: ${verificationUrl}`
		};

		if (!user.pendingEmail.includes('expresswebapptemplate.com')) {
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					getLogger().error(error);
				}
				getLogger().info(`Email update message sent for email=${user.email}`);
			});
		}
	}

	async updateEmail(token: string) {
		const user = await this.userRepository.getUserByEmailUpdateToken(token);
		if (user.emailUpdate.expiration < new Date().toISOString()) {
			throw new Error('Token has expired');
		}
		user.email = user.pendingEmail;
		user.isVerified = true;
		user.pendingEmail = '';
		user.emailUpdate.token = '';
		user.emailUpdate.expiration = '';
		await this.userRepository.updateUser(user);
	}
}