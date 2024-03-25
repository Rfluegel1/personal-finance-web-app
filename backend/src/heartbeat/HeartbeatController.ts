import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {getLogger} from '../logger'

export default class HeartbeatController {
    heartbeat(request: Request, response: Response): Response<string> {
        getLogger().info('Received heartbeat request')
        const version: string = '1.0.0'

        getLogger().info('Sending heartbeat response')
        return response.status(StatusCodes.OK).send({version: version})
    }
}
