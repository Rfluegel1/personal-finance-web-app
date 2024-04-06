import Bank from './Bank'
import BankRepository from './BankRepository'
import {CipherUtility} from '../CipherUtility'
import {getLogger} from '../logger'

export default class BankService {

    bankRepository = new BankRepository()

    async createBank(accessToken: string, owner: string) {
        getLogger().info('Creating bank', {owner: owner})
        const encrypted = CipherUtility.encrypt(accessToken)
        const bank = new Bank(encrypted, owner)
        await this.bankRepository.saveBank(bank)
        getLogger().info('Bank created', {owner: owner})
        return bank
    }

    async deleteBank(id: string): Promise<void> {
        getLogger().info('Deleting bank', {id: id})
        return await this.bankRepository.deleteBank(id)
    }

    async getBank(id: string) {
        getLogger().info('Getting bank', {id: id})
        const bank = await this.bankRepository.getBank(id)
        bank.accessToken = CipherUtility.decrypt(bank.accessToken)
        getLogger().info('Bank retrieved', {id: id})
        return bank
    }

    async getBanksByOwner(owner: string) {
        getLogger().info('Getting banks by owner', {owner: owner})
        const banks = await this.bankRepository.getBanksByOwner(owner)
        for (let bank of banks) {
            bank.accessToken = CipherUtility.decrypt(bank.accessToken)
        }
        getLogger().info('Banks retrieved by owner', {owner: owner})
        return banks
    }

    async updateBank(id: string, accessToken: string, owner: string) {
        getLogger().info('Updating bank', {id: id})
        const bank = await this.getBank(id)
        const encrypted = CipherUtility.encrypt(accessToken)
        bank.updateDefinedFields(encrypted, owner)
        await this.bankRepository.saveBank(bank)
        getLogger().info('Bank updated', {id: id})
        return bank
    }
}