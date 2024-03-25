import {Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import HealthCheckService from './HealthCheckService'
import {getLogger} from '../logger'

export default class HealthCheckController {
    healthCheckService: HealthCheckService = new HealthCheckService()

    async healthcheck(request: Request, response: Response) {
        getLogger().info('Received healthcheck request')
        let healthStatus: any = await this.healthCheckService.healthcheck()

        getLogger().info('Sending healthcheck response')
        return response.status(StatusCodes.OK).send(healthStatus)
    }
}