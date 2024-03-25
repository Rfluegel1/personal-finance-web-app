import { NextFunction, Request, Response } from 'express';
import VerificationService from './VerificationService';
import { getLogger } from '../logger';
import User from '../users/User';
import { StatusCodes } from 'http-status-codes';
import { UnauthorizedException } from '../exceptions/UnauthorizedException';
import Joi from 'joi';
import { checkForHtml, validateRequest } from '../utils';

export default class VerificationController {
	verificationService = new VerificationService();

	validationSchema = Joi.object({
		token: Joi.string().uuid(),
		email: Joi.string().email(),
		password: Joi.string().max(255).custom(checkForHtml()),
		confirmPassword: Joi.string().valid(Joi.ref('password')).messages({
			'any.only': '"confirmPassword" must match "password"',
		}),
	});

	async sendVerificationEmail(request: Request, response: Response, next: NextFunction) {
		if (!request.isAuthenticated()) {
			return next(new UnauthorizedException('send email verification'));
		}
		const userId = (request.user as User).id;
		getLogger().info(`Received send verification email request for user id=${userId}`);
		validateRequest(request, next, this.validationSchema);
		try {
			await this.verificationService.sendVerificationEmail(userId);
			getLogger().info(`Successful send verification email request for user id=${userId}`);
			response.status(StatusCodes.CREATED).send();
		} catch (error) {
			next(error);
		}
	}

	async verifyEmail(request: Request, response: Response, next: NextFunction) {
		const token = request.query.token as string;
		getLogger().info(`Received verify email request for token=${token}`);
		validateRequest(request, next, this.validationSchema);
		try {
			await this.verificationService.verifyEmail(token);
			getLogger().info(`Successful verify email request for token=${token}`);
			response.status(StatusCodes.OK).send();
		} catch (error) {
			next(error);
		}
	}

	async requestPasswordReset(request: Request, response: Response, next: NextFunction) {
		const email = request.body.email;
		getLogger().info(`Received send password reset email request for email=${email}`);
		validateRequest(request, next, this.validationSchema);
		try {
			await this.verificationService.requestPasswordReset(email);
			getLogger().info(`Successful send password reset email request for user email=${email}`);
			response.status(StatusCodes.CREATED).send();
		} catch (error) {
			next(error);
		}
	}

	async resetPassword(request: Request, response: Response, next: NextFunction) {
		const token = request.query.token as string;
		const password = request.body.password;
		getLogger().info(`Received reset password request for token=${token}`);
		validateRequest(request, next, this.validationSchema);
		try {
			await this.verificationService.resetPassword(token, password);
			getLogger().info(`Successful reset password request for token=${token}`);
			response.status(StatusCodes.OK).send();
		} catch (error) {
			next(error);
		}
	}

	async requestEmailChange(request: Request, response: Response, next: NextFunction) {
		if (!request.isAuthenticated()) {
			return next(new UnauthorizedException('send email update email'));
		}
		const userId = (request.user as User).id;
		const email = request.body.email;
		getLogger().info(`Received send email update email request for user id=${userId}`);
		validateRequest(request, next, this.validationSchema);
		try {
			await this.verificationService.requestEmailChange(userId, email);
			getLogger().info(`Successful send email update email request for user id=${userId}`);
			response.status(StatusCodes.CREATED).send();
		} catch (error) {
			next(error);
		}
	}

	async updateEmail(request: Request, response: Response, next: NextFunction) {
		const token = request.query.token as string;
		getLogger().info(`Received update email request for token=${token}`);
		validateRequest(request, next, this.validationSchema);
		try {
			await this.verificationService.updateEmail(token);
			getLogger().info(`Successful update email request for token=${token}`);
			response.status(StatusCodes.OK).send();
		} catch (error) {
			next(error);
		}
	}
}
