import {Router} from 'express'
import HealthCheckController from './HealthCheckController'


const router: Router = Router()

let healthCheckController: HealthCheckController = new HealthCheckController()

/**
 * @swagger
 * tags:
 *   name: HealthCheck
 *   description: HealthCheck management
 *
 * /api/health-check:
 *   get:
 *     tags: [HealthCheck]
 *     summary: Checks for dependency status.
 *     responses:
 *       200:
 *         description: A map of connection statuses.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                 integrations:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         result:
 *                           type: string
 *                           description: The result of the database connection.
 *                           example: "connected"
 *                         details:
 *                           type: string
 *                           description: The details of the database connection.
 */
router.get('/health-check', healthCheckController.healthcheck.bind(healthCheckController))

export default router