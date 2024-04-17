import {NextFunction, Request, Response} from 'express'
import BankService from './BankService'
import {StatusCodes} from 'http-status-codes'
import User from '../users/User'
import {UnauthorizedException} from '../exceptions/UnauthorizedException'
import {BadRequestException} from '../exceptions/BadRequestException'
import {getLogger} from '../logger'

export default class BankController {

    bankService = new BankService()

    async createBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create bank request', {requestUser: request.user})
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('create a bank'))
        }
        const accessToken = request.body.accessToken
        const owner = (request.user as User).id
        const itemId = request.body.itemId
        try {
            const bank = await this.bankService.createBank(accessToken, owner, itemId)
            getLogger().info('Sending create bank request')
            response.status(StatusCodes.CREATED).send(bank)
        } catch (e: any) {
            next(e)
        }
    }

    async deleteBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received delete bank request', {requestUser: request.user})
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('delete a bank'))
        }
        const id = request.params.id
        try {
            await this.bankService.deleteBank(id)
            getLogger().info('Sending delete bank request')
            response.sendStatus(StatusCodes.NO_CONTENT)
        } catch (e: any) {
            next(e)
        }
    }

    async getBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received get bank request', {requestUser: request.user})
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('get a bank'))
        }
        const id = request.params.id
        try {
            const bank = await this.bankService.getBank(id)
            getLogger().info('Sending get bank request')
            response.status(StatusCodes.OK).send(bank)
        } catch (e: any) {
            next(e)
        }
    }

    async getBanksByQuery(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received get banks by query request', {requestUser: request.user})
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('query banks'))
        }
        const owner = request.query.owner
        const itemId = request.query.itemId
        if (!owner && !itemId) {
            return next(new BadRequestException('owner or itemId is required'))
        }
        if (owner) {
            try {
                const banks = await this.bankService.getBanksByOwner(owner as string)
                getLogger().info('Sending get banks by owner request')
                response.status(StatusCodes.OK).send({banks: banks})
            } catch (e: any) {
                next(e)
            }
        } else if (itemId) {
            try {
                const bank = await this.bankService.getBankByItemId(itemId as string)
                getLogger().info('Sending get bank by itemId request')
                response.status(StatusCodes.OK).send(bank)
            } catch (e: any) {
                next(e)
            }
        }
    }

    async updateBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received update bank request', {requestUser: request.user})
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('update a bank'))
        }
        const id = request.params.id
        const accessToken = request.body.accessToken
        const owner = request.body.owner
        const itemId = request.body.itemId
        try {
            const bank = await this.bankService.updateBank(id, accessToken, owner, itemId)
            getLogger().info('Sending update bank request')
            response.status(StatusCodes.OK).send(bank)
        } catch (e: any) {
            next(e)
        }
    }
}