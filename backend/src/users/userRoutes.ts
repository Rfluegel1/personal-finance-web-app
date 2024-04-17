import express from 'express'
import UserController from './UserController'

const router = express.Router()

let userController = new UserController()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 * components:
 *  securitySchemes:
 *    cookieAuth:    # For cookies
 *      type: apiKey
 *      in: cookie
 *      name: connect.sid
 * /api/users/is-verified:
 *   get:
 *     tags: [Users]
 *     summary: Returns a boolean value indicating if the user has verified their email.
 *     responses:
 *       200:
 *         description: A boolean value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isVerified:
 *                   type: boolean
 *                   description: A boolean value indicating if the user has verified their email.
 */
router.get('/users/is-verified', userController.isVerified.bind(userController))

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Returns a user by id.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The user ID.
 *     responses:
 *       200:
 *         description: A user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The user's email.
 *                 isVerified:
 *                   type: boolean
 *                   description: A boolean value indicating if the user has verified their email.
 */
router.get('/users/:id', userController.getUser.bind(userController))

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Updates a user by id. Admin only.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The user ID.
 *     responses:
 *       200:
 *         description: A user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The user's email.
 *                 isVerified:
 *                   type: boolean
 *                   description: A boolean value indicating if the user has verified their email.
 *                 passwordHash:
 *                   type: string
 *                   description: The user's password hash.
 *                 role:
 *                   type: string
 *                   description: The user's role.
 *                 pendingEmail:
 *                   type: string
 *                   format: email
 *                   description: The user's pending email.
 *                 passwordReset:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       format: uuid
 *                       description: The password reset token.
 *                     expiration:
 *                       type: string
 *                       format: date-time
 *                       description: The password reset token expiration date.
 *                       example: 2021-08-01T00:00:00.000Z
 *                 emailUpdate:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       format: uuid
 *                       description: The email update token.
 *                     expiration:
 *                       type: string
 *                       format: date-time
 *                       description: The email update token expiration date.
 *                       example: 2021-08-01T00:00:00.000Z
 *                 emailVerification:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       format: uuid
 *                       description: The email verification token.
 *                     expiration:
 *                       type: string
 *                       format: date-time
 *                       description: The email verification token expiration date.
 *                       example: 2021-08-01T00:00:00.000Z
 */
router.put('/users/:id', userController.updateUser.bind(userController))

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Returns a user by email query.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *           description: The user email.
 *     responses:
 *       200:
 *         description: A user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The user's email.
 *                 isVerified:
 *                   type: boolean
 *                   description: A boolean value indicating if the user has verified their email.
 */
router.get('/users', userController.getUserByEmail.bind(userController))

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deletes a user by id.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The user ID.
 *     responses:
 *       204:
 *         description: Delete user.
 */
router.delete('/users/:id', userController.deleteUser.bind(userController))

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Creates a user.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *               confirmPassword:
 *                 type: string
 *                 description: The user's password confirmation.
 *     responses:
 *       201:
 *         description: A user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The user's email.
 *                 isVerified:
 *                   type: boolean
 *                   description: A boolean value indicating if the user has verified their email.
 */
router.post('/users', userController.createUser.bind(userController))

export default router