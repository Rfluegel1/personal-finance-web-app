import {Router} from 'express'
import PlaidController from './PlaidController'


const router: Router = Router()

let plaidController: PlaidController = new PlaidController()

/**
 * @swagger
 * tags:
 *   name: Plaid
 *   description: Plaid integration management
 *
 * /api/create_link_token:
 *   post:
 *     tags: [Plaid]
 *     summary: Creates link token.
 *     responses:
 *       201:
 *         description: A temporary link token to be used with subsequent requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 link_token:
 *                   type: string
 *                   description: A link token provided by plaid.
 */
router.post('/create_link_token', plaidController.createLinkToken.bind(plaidController))

/**
 * @swagger
 * /api/create_access_token:
 *   post:
 *     tags: [Plaid]
 *     summary: Creates access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                 public_token:
 *                   type: string
 *                   description: The public_token provided by plaid link.
 *     responses:
 *       201:
 *         description: A permanent access token to be used with subsequent requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: An access token provided by plaid.
 */
router.post('/exchange_token_and_save_bank', plaidController.exchangeTokenAndSaveBank.bind(plaidController))

/**
 * @swagger
 * /api/overview:
 *   get:
 *     tags: [Plaid]
 *     summary: Gets bank names and their account names.
 *     responses:
 *       '200':
 *         description: A list of banks with their accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Huntington Bank
 *                   accounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: Plaid Checking
 */
router.get('/overview', plaidController.getOverview.bind(plaidController))

export default router