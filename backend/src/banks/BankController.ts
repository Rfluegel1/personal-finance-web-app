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
        try {
            const bank = await this.bankService.createBank(accessToken, owner)
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

    async getBanksByOwner(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received get banks by owner request', {requestUser: request.user})
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('delete a bank by owner'))
        }
        const owner = request.query.owner
        if (!owner) {
            return next(new BadRequestException('owner is required'))
        }
        try {
            const banks = await this.bankService.getBanksByOwner(owner as string)
            getLogger().info('Sending get banks by owner request')
            response.status(StatusCodes.OK).send({banks: banks})
        } catch (e: any) {
            next(e)
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
        try {
            const bank = await this.bankService.updateBank(id, accessToken, owner)
            getLogger().info('Sending update bank request')
            response.status(StatusCodes.OK).send(bank)
        } catch (e: any) {
            next(e)
        }
    }
}