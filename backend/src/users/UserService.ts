import User from './User'
import UserRepository from './UserRepository'
import bcrypt from 'bcrypt'
import VerificationService from '../verification/VerificationService';


export default class UserService {
    userRepository = new UserRepository()
    verificationService = new VerificationService()

    async createUser(email: string, password: string): Promise<User> {
        const passwordHash = await bcrypt.hash(password, 10)
        const user: User = new User(email, passwordHash)
        await this.userRepository.createUser(user)
        await this.verificationService.sendVerificationEmail(user.id)
        return user
    }

    async deleteUser(id: string): Promise<void> {
        await this.userRepository.deleteUser(id)
    }

    async getUser(id: string): Promise<User> {
        return await this.userRepository.getUser(id)
    }

    async getUserByEmail(email: string): Promise<User> {
        return await this.userRepository.getUserByEmail(email)
    }

    async updateUser(
      id: string,
      email: string,
      password: string,
      isVerified: boolean,
      emailVerification: { token: string, expiration: string } | undefined,
      role: string, passwordReset: { token: string, expiration: string } | undefined,
      emailUpdate: { token: string, expiration: string } | undefined,
      pendingEmail: string
    ): Promise<User> {
        let user: User = await this.userRepository.getUser(id)
        let passwordHash
        if (password) {
            passwordHash = await bcrypt.hash(password, 10)
        }
        user.updateDefinedFields(email, passwordHash, isVerified, emailVerification, role, passwordReset, emailUpdate, pendingEmail)
        await this.userRepository.updateUser(user)
        return user
    }
}