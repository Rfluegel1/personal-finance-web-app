import Bank from './Bank'
import BankRepository from './BankRepository'
import {CipherUtility} from '../CipherUtility'

export default class BankService {

    bankRepository = new BankRepository()

    async createBank(accessToken: string, owner: string) {
        const encrypted = CipherUtility.encrypt(accessToken)
        const bank = new Bank(encrypted, owner)
        await this.bankRepository.saveBank(bank)
        return bank
    }

    async deleteBank(id: string): Promise<void> {
        return await this.bankRepository.deleteBank(id)
    }

    async getBank(id: string) {
        const bank = await this.bankRepository.getBank(id)
        bank.accessToken = CipherUtility.decrypt(bank.accessToken)
        return bank
    }

    async getBanksByOwner(owner: string) {
        const banks = await this.bankRepository.getBanksByOwner(owner)
        for (let bank of banks) {
            bank.accessToken = CipherUtility.decrypt(bank.accessToken)
        }
        return banks
    }

    async updateBank(id: string, accessToken: string, owner: string) {
        const bank = await this.getBank(id)
        const encrypted = CipherUtility.encrypt(accessToken)
        bank.updateDefinedFields(encrypted, owner)
        await this.bankRepository.saveBank(bank)
        return bank
    }
}