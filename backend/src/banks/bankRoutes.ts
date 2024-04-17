import express from 'express';
import BankController from './BankController';

const router = express.Router();

let bankController = new BankController();
/**
 * @swagger
 * tags:
 *   name: Banks
 *   description: Bank management. Admin only.
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:    # For cookies
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *
 * /api/banks?owner=:userId:
 *   get:
 *     tags: [Banks]
 *     summary: Returns a list of banks owned by userId. Admin only.
 *     responses:
 *       200:
 *         description: A list of banks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: The user ID.
 *                   accessToken:
 *                     type: string
 *                     description: The token provided by plaid for api access to banks.
 *                   owner:
 *                     type: string
 *                     description: The user's id.
 */
router.get('/banks', bankController.getBanksByQuery.bind(bankController));

/**
 * @swagger
 * /api/banks/:id:
 *   get:
 *     summary: Returns a banks by id that is created by authenticated user. Admin only.
 *     tags: [Banks]
 *     parameters:
 *       - in: parameter
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The banks ID.
 *     responses:
 *       200:
 *         description: A banks.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 accessToken:
 *                   type: string
 *                   description: The token provided by plaid for api access to banks.
 *                 owner:
 *                   type: string
 *                   description: The user's id.
 */
router.get('/banks/:id', bankController.getBank.bind(bankController));

/**
 * @swagger
 * /api/banks/:id:
 *   put:
 *     summary: Updates a banks by id. Admin only.
 *     tags: [Banks]
 *     parameters:
 *       - in: parameter
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The banks ID.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                 accessToken:
 *                   type: string
 *                   description: The token provided by plaid for api access to banks.
 *                 owner:
 *                   type: string
 *                   description: The user's id.
 *     responses:
 *       200:
 *         description: A banks.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 accessToken:
 *                   type: string
 *                   description: The token provided by plaid for api access to banks.
 *                 owner:
 *                   type: string
 *                   description: The user's id.
 */
router.put('/banks/:id', bankController.updateBank.bind(bankController));

/**
 * @swagger
 * /api/banks/:id:
 *   delete:
 *     summary: Deletes a banks by id that is created by authenticated user. Admin only.
 *     tags: [Banks]
 *     parameters:
 *       - in: parameter
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The banks ID.
 *     responses:
 *       204:
 *         description: Deletes banks.
 */
router.delete('/banks/:id', bankController.deleteBank.bind(bankController));

/**
 * @swagger
 * /api/banks:
 *   post:
 *     summary: Creates a banks. Admin only.
 *     tags: [Banks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: The banks's text details.
 *     responses:
 *       201:
 *         description: Successfully created banks.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 accessToken:
 *                   type: string
 *                   description: The token provided by plaid for api access to banks.
 *                 owner:
 *                   type: string
 *                   description: The user's id.
 */
router.post('/banks', bankController.createBank.bind(bankController));

export default router