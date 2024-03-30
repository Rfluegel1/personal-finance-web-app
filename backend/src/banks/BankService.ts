import Bank from './Bank'
import BankRepository from './BankRepository'

export default class BankService {

    bankRepository = new BankRepository()
    async createBank(accessToken: string, owner: string) {
        const bank = new Bank(accessToken, owner)
        await this.bankRepository.saveBank(bank)
        return bank;
    }

    async deleteBank(id: string): Promise<void> {
        return await this.bankRepository.deleteBank(id)
    }

    async getBank(id: string) {
        return await this.bankRepository.getBank(id)
    }

    async getBanksByOwner(owner: string) {
        return await this.bankRepository.getBanksByOwner(owner)
    }

    async updateBank(id: string, accessToken: string, owner: string) {
        const bank = await this.getBank(id)
        bank.updateDefinedFields(accessToken, owner)
        await this.bankRepository.saveBank(bank)
        return bank
    }
}