import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {getLogger} from '../logger'
import PlaidService from './PlaidService'

export default class PlaidController {
    plaidService = new PlaidService()

    async createLinkToken(request: Request, response: Response): Promise<Response<string>> {
        getLogger().info('Received create link token request')
        const linkToken = await this.plaidService.createLinkToken()
        getLogger().info('Sending create link token response')
        return response.status(StatusCodes.CREATED).send(linkToken)
    }

    async createAccessToken(request: Request, response: Response): Promise<Response<string>> {
        getLogger().info('Received create access token request')
        const accessToken = await this.plaidService.createAccessToken(request.body.public_token)
        getLogger().info('Sending create access token response')
        return response.status(StatusCodes.CREATED).send(accessToken)
    }
}
