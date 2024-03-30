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

    async exchangeTokenAndSaveBank(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create access token request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('create access token'))
        }
        const publicToken = request.body.public_token
        const userId = (request.user as User).id
        try {
            const bankId = await this.plaidService.exchangeTokenAndSaveBank(publicToken, userId)
            getLogger().info('Sending create access token response')
            return response.status(StatusCodes.CREATED).send(bankId)
        } catch (error) {
            next(error)
        }
    }
}
