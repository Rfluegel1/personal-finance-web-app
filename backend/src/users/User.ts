import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';
import bcrypt from 'bcrypt';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export default class User {
	@PrimaryGeneratedColumn('uuid')
	id: string = uuidv4();

	@Column({ type: 'varchar', nullable: false, unique: true })
	email: string;

	@Column({ type: 'varchar', nullable: false, name: 'passwordhash' })
	passwordHash: string;

	@Column({ type: 'boolean', name: 'isverified', default: false, nullable: true })
	isVerified: boolean | undefined;

	@Column({ type: 'json', nullable: true, name: 'emailverification' })
	emailVerification: { token: string; expiration: string };

	@Column({ type: 'varchar', default: 'user' })
	role: string;

	@Column({ type: 'json', name: 'passwordreset', nullable: true })
	passwordReset: { token: string; expiration: string };

	@Column({ type: 'json', name: 'emailupdate', nullable: true })
	emailUpdate: { token: string; expiration: string };

	@Column({ type: 'varchar', name: 'pendingemail', nullable: true })
	pendingEmail: string;

	constructor(
		email: string = '',
		passwordHash: string = '',
		isVerified: boolean = false,
		emailVerification: { token: string; expiration: string } = { token: '', expiration: '' },
		role: string = 'user',
		passwordReset: { token: string; expiration: string } = { token: '', expiration: '' },
		emailUpdate: { token: string; expiration: string } = { token: '', expiration: '' },
		pendingEmail: string = '') {
		this.email = email;
		this.passwordHash = passwordHash;
		this.isVerified = isVerified;
		this.emailVerification = emailVerification;
		this.role = role;
		this.passwordReset = passwordReset;
		this.emailUpdate = emailUpdate;
		this.pendingEmail = pendingEmail;
	}

	userMapper(queryResult: any): User {
		const intermediate = {
			id: queryResult?.id,
			email: queryResult?.email,
			passwordHash: queryResult?.passwordhash,
			isVerified: queryResult?.isverified,
			emailVerification: {
				token: queryResult?.emailverification?.token,
				expiration: queryResult?.emailverification?.expiration
			},
			role: queryResult?.role,
			emailUpdate: {
				token: queryResult?.emailupdate?.token,
				expiration: queryResult?.emailupdate?.expiration
			},
			passwordReset: {
				token: queryResult?.passwordreset?.token,
				expiration: queryResult?.passwordreset?.expiration
			},
			pendingEmail: queryResult?.pendingemail
		};
		return plainToClass(User, intermediate);
	}

	async isValidPassword(password: string) {
		return await bcrypt.compare(password, this.passwordHash);
	}

	updateDefinedFields(
		email: string | undefined,
		passwordHash: string | undefined,
		isVerified: boolean | undefined,
		emailVerification: { token: string; expiration: string } | undefined,
		role: string | undefined,
		passwordReset: { token: string; expiration: string } | undefined,
		emailUpdate: { token: string; expiration: string } | undefined,
		pendingEmail: string | undefined
	) {
		if (email !== undefined) {
			this.email = email;
		}
		if (passwordHash !== undefined) {
			this.passwordHash = passwordHash;
		}
		if (isVerified !== undefined) {
			this.isVerified = isVerified;
		}
		if (emailVerification?.token !== undefined) {
			this.emailVerification.token = emailVerification.token;
		}
		if (emailVerification?.expiration !== undefined) {
			this.emailVerification.expiration = emailVerification.expiration;
		}
		if (emailUpdate?.token !== undefined) {
			this.emailUpdate.token = emailUpdate.token;
		}
		if (emailUpdate?.expiration !== undefined) {
			this.emailUpdate.expiration = emailUpdate.expiration;
		}
		if (passwordReset?.token !== undefined) {
			this.passwordReset.token = passwordReset.token;
		}
		if (passwordReset?.expiration !== undefined) {
			this.passwordReset.expiration = passwordReset.expiration;
		}
		if (role !== undefined) {
			this.role = role;
		}
		if (pendingEmail !== undefined) {
			this.pendingEmail = pendingEmail;
		}
	}

}