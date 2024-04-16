import Bank from './Bank'
import DataSourceService from '../dataSource/DataSourceService'
import {getLogger} from '../logger'
import {DatabaseException} from '../exceptions/DatabaseException'
import {NotFoundException} from '../exceptions/NotFoundException'

export default class BankRepository {

    bankRepository = DataSourceService.getInstance().getDataSource().getRepository(Bank)

    async saveBank(bank: Bank) {
        await this.executeWithCatch(async () => {
            await this.bankRepository.save(bank)
        })
    }

    async deleteBank(id: string) {
        await this.executeWithCatch(async () => {
            await this.bankRepository.delete(id)
        })
    }

    async getBank(id: string) {
        const bank = await this.executeWithCatch(async () => {
            return await this.bankRepository.findOne({where: {id: id}})
        })
        if (!bank) {
            throw new NotFoundException(id)
        }
        return bank
    }

    async getBanksByOwner(owner: string) {
        return await this.executeWithCatch(async () => {
            return await this.bankRepository.find({where: {owner: owner}})
        })
    }

    async getBankByItemId(itemId: string) {
        const bank = await this.executeWithCatch(async () => {
            return await this.bankRepository.findOne({where: {itemId: itemId}})
        })
        if (!bank) {
            throw new NotFoundException(itemId)
        }
        return bank
    }

    async executeWithCatch(action: () => Promise<any>): Promise<any> {
        try {
            return await action()
        } catch (error) {
            getLogger().error(error)
            throw new DatabaseException()
        }
    }
}