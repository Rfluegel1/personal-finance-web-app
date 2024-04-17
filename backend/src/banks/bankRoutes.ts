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
 * /api/banks?query=:value:
 *   get:
 *     tags: [Banks]
 *     summary: Returns a list or single bank that match the query. Admin only.
 *     parameters:
 *       - in: query
 *         name: owner
 *         required: false
 *         schema:
 *           type: string
 *         description: The user ID to filter the list of banks. Mutually exclusive search query.
 *       - in: query
 *         name: itemId
 *         required: false
 *         schema:
 *           type: string
 *         description: The item ID to filter the single bank. Mutually exclusive search query.
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
 * /api/banks/{id}:
 *   get:
 *     summary: Returns a bank by id that is created by authenticated user. Admin only.
 *     tags: [Banks]
 *     parameters:
 *       - in: path
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
 * /api/banks/{id}:
 *   put:
 *     summary: Updates a banks by id. Admin only.
 *     tags: [Banks]
 *     parameters:
 *       - in: path
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
 *                 itemId:
 *                   type: string
 *                   description: The item id.
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
 * /api/banks/{id}:
 *   delete:
 *     summary: Deletes a banks by id that is created by authenticated user. Admin only.
 *     tags: [Banks]
 *     parameters:
 *       - in: path
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