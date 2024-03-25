import {Router} from 'express'
import HeartbeatController from './HeartbeatController'


const router: Router = Router()

let heartbeatController: HeartbeatController = new HeartbeatController()

/**
 * @swagger
 * tags:
 *   name: Heartbeat
 *   description: Heartbeat management
 *
 * /api/heartbeat:
 *   get:
 *     tags: [Heartbeat]
 *     summary: Gives application version.
 *     responses:
 *       200:
 *         description: A application version after success.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: The version of the application.
 */
router.get('/heartbeat', heartbeatController.heartbeat.bind(heartbeatController))

export default router