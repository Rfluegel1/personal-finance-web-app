import User from '../users/User';
import passport from 'passport';
import UserRepository from '../users/UserRepository';
import { UnauthorizedException } from '../exceptions/UnauthorizedException';
import { getLogger } from '../logger';
import { NotFoundException } from '../exceptions/NotFoundException';
import PgSession from 'connect-pg-simple';
import session from 'express-session';

let LocalStrategy = require('passport-local');

export default class PassportService {
	userRepository: UserRepository = new UserRepository();

	configureSessionStore() {
		const pgSession = PgSession(session);

		const sessionStore = new pgSession({
			conString: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOSTNAME}/${process.env.DB_DATABASE}`,
			createTableIfMissing: true,
			tableName: 'sessions'
		});

		return session({
			store: sessionStore,
			secret: process.env.PASSPORT_SECRET as string,
			resave: false,
			saveUninitialized: false,
			cookie: { maxAge: 24 * 60 * 60 * 1000 }
		});
	}

	setAuthenticationStrategy() {
		return passport.authenticate('session');
	}

	serializeUser() {
		passport.serializeUser((user, done) => {
			// Storing user id in the session
			process.nextTick(() => done(null, (user as User).id));
		});
	}

	deserializeUser() {
		passport.deserializeUser(async (id: string, done) => {
			process.nextTick(async () => {
				try {
					const user = await this.userRepository.getUser(id); // Fetch user from database
					done(null, user);
				} catch (err) {
					done(err, null);
				}
			});
		});
	}

	useLocalStrategy() {
		passport.use(new LocalStrategy(
			async (email: string, password: string, done: any) => {
				try {
					const user = await this.userRepository.getUserByEmail(email);
					if (!user) {
						getLogger().info(`User not found for email=${email}`);
						return done(new UnauthorizedException('incorrect username or password'));
					}
					if (!await user.isValidPassword(password)) {
						getLogger().info(`Invalid password for email=${email}`);
						return done(new UnauthorizedException('incorrect username or password'));
					}
					getLogger().info(`User authenticated for email=${email}`);
					return done(null, user);
				} catch (err) {
					if (err instanceof NotFoundException) {
						getLogger().error(err.message);
						return done(new UnauthorizedException('incorrect username or password'));
					}
					return done(err);
				}
			}
		));
	}
}