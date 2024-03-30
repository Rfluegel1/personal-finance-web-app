import {NextFunction, Request, Response} from 'express'
import BankService from './BankService'
import {StatusCodes} from 'http-status-codes'
import User from '../users/User'
import {UnauthorizedException} from '../exceptions/UnauthorizedException'

export default class BankController {

    bankService = new BankService()

    async createBank(request: Request, response: Response, next: NextFunction) {
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('create a bank'))
        }
        const accessToken = request.body.accessToken
        const owner = (request.user as User).id
        try {
            const bank = await this.bankService.createBank(accessToken, owner)
            response.status(StatusCodes.CREATED).send(bank)
        } catch (e: any) {
            next(e)
        }
    }

    async deleteBank(request: Request, response: Response, next: NextFunction) {
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('delete a bank'))
        }
        const id = request.params.id
        try {
            await this.bankService.deleteBank(id)
            response.sendStatus(StatusCodes.NO_CONTENT)
        } catch (e: any) {
            next(e)
        }
    }

    async getBank(request: Request, response: Response, next: NextFunction) {
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('get a bank'))
        }
        const id = request.params.id
        try {
            const bank = await this.bankService.getBank(id)
            response.status(StatusCodes.OK).send(bank)
        } catch (e: any) {
            next(e)
        }
    }

    async getBanksByOwner(request: Request, response: Response, next: NextFunction) {
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('delete a bank by owner'))
        }
        const owner = request.query.owner
        try {
            const banks = await this.bankService.getBanksByOwner(owner as string)
            response.status(StatusCodes.OK).send({banks: banks})
        } catch (e: any) {
            next(e)
        }
    }

    async updateBank(request: Request, response: Response, next: NextFunction) {
        if (!request.isAuthenticated() || (request.user as User).role !== 'admin') {
            return next(new UnauthorizedException('update a bank'))
        }
        const id = request.params.id
        const accessToken = request.body.accessToken
        const owner = request.body.owner
        try {
            const bank = await this.bankService.updateBank(id, accessToken, owner)
            response.status(StatusCodes.OK).send(bank)
        } catch (e: any) {
            next(e)
        }
    }
}