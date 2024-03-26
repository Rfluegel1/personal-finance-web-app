import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {getLogger} from '../logger'

export default class PlaidController {
    createLinkToken(request: Request, response: Response): Response<string> {
        getLogger().info('Received create link token request')

        getLogger().info('Sending create link token response')
        return response.status(StatusCodes.CREATED).send({link_token: 'asd'})
    }
}
