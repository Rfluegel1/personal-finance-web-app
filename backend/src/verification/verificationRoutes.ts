import express from 'express'
import VerificationController from './VerificationController';

const router = express.Router()

let verificationController = new VerificationController()

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: Verification management
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:    # For cookies
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *
 * /api/verify-email:
 *   get:
 *     tags: [Verification]
 *     summary: Verifies email by token.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The verification token.
 *     responses:
 *       200:
 *         description: Successfully verified email.
 */
router.get('/verify-email', verificationController.verifyEmail.bind(verificationController))

/**
 * @swagger
 * /api/send-verification-email:
 *   post:
 *     tags: [Verification]
 *     summary: Sends verification email.
 *     responses:
 *       201:
 *         description: Successfully created and sent email.
 */
router.post('/send-verification-email', verificationController.sendVerificationEmail.bind(verificationController))

/**
 * @swagger
 * /api/send-password-rest:
 *   post:
 *     tags: [Verification]
 *     summary: Sends password reset email.
 *     responses:
 *       201:
 *         description: Successfully created and sent email.
 */
router.post('/request-password-reset', verificationController.requestPasswordReset.bind(verificationController))

/**
 * @swagger
 * /api/request-email-change:
 *   post:
 *     tags: [Verification]
 *     summary: Sends email change email.
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
 *                 description: The users new email.
 *     responses:
 *       201:
 *         description: Successfully created and sent email.
 */
router.post('/request-email-change', verificationController.requestEmailChange.bind(verificationController))

/**
 * @swagger
 * /api/reset-password:
 *   put:
 *     tags: [Verification]
 *     summary: Verifies password by token.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The verification token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: The user's password.
 *               confirmPassword:
 *                 type: string
 *                 description: The user's password confirmation.
 *     responses:
 *       200:
 *         description: Successfully verified email.
 */
router.put('/reset-password', verificationController.resetPassword.bind(verificationController))

/**
 * @swagger
 * /api/update-email:
 *   get:
 *     tags: [Verification]
 *     summary: Verifies updated email by token.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The verification token.
 *     responses:
 *       200:
 *         description: Successfully verified email.
 */
router.get('/update-email', verificationController.updateEmail.bind(verificationController))

export default router