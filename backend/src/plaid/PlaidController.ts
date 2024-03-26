import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {getLogger} from '../logger'
import PlaidService from './PlaidService'

export default class PlaidController {
    plaidService = new PlaidService()
    createLinkToken(request: Request, response: Response): Response<string> {
        getLogger().info('Received create link token request')
        this.plaidService.createLinkToken()
        getLogger().info('Sending create link token response')
        return response.status(StatusCodes.CREATED).send({link_token: 'asd'})
    }
}