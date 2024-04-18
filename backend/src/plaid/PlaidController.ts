import {NextFunction, Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {getLogger} from '../logger'
import PlaidService from './PlaidService'
import {UnauthorizedException} from '../exceptions/UnauthorizedException'
import User from '../users/User'

export default class PlaidController {
    plaidService = new PlaidService()

    async createLinkToken(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create link token request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('create link token'))
        }
        try {
            const linkToken = await this.plaidService.createLinkToken((request.user as User).id)
            getLogger().info('Sending create link token response')
            return response.status(StatusCodes.CREATED).send(linkToken)
        } catch (error) {
            next(error)
        }
    }

    async createUpdateLinkToken(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create update link token request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('create update link token'))
        }
        try {
            const linkToken = await this.plaidService.createUpdateLinkToken((request.user as User).id, request.body.itemId)
            getLogger().info('Sending create update link token request')
            return response.status(StatusCodes.CREATED).send(linkToken)
        } catch (error) {
            next(error)
        }

    }

    async exchangeTokenAndSaveBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create exchange token and save bank request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('create exchange token and save bank'))
        }
        const publicToken = request.body.public_token
        const userId = (request.user as User).id
        try {
            const bankId = await this.plaidService.exchangeTokenAndSaveBank(publicToken, userId)
            getLogger().info('Sending create exchange token and save bank response')
            return response.status(StatusCodes.CREATED).send(bankId)
        } catch (error) {
            next(error)
        }
    }

    async exchangeTokenAndUpdateBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create exchange token and update bank request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('create exchange token and update bank'))
        }
        const bankId = request.body.bankId
        const publicToken = request.body.publicToken
        try {
            await this.plaidService.exchangeTokenAndUpdateBank(publicToken, bankId)
            getLogger().info('Sending create exchange token and update bank response')
            return response.status(StatusCodes.CREATED).send({bankId: bankId})
        } catch (error) {
            next(error)
        }
    }

    async getOverview(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received get overview request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('get overview'))
        }
        const userId = (request.user as User).id
        try {
            const banks = await this.plaidService.getOverview(userId)
            getLogger().info('Sending get overview response')
            return response.status(StatusCodes.OK).send(banks)
        } catch (error) {
            next(error)
        }
    }
}
