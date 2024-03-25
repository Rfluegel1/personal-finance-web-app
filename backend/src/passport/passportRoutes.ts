import express from 'express';
import passport from 'passport';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Passport
 *   description: Passport management
 *
 * /api/login:
 *   post:
 *     tags: [Passport]
 *     summary: Logs in a user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's email or username.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *             required:
 *               - username
 *               - password
 */
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

/**
 * @swagger
 * /api/session-check:
 *   get:
 *     summary: Checks if a session is active.
 *     tags: [Passport]
 *     responses:
 *       200:
 *         description: A boolean value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionActive:
 *                   type: boolean
 *                   description: A boolean value indicating if a session is active.
 */
router.get('/session-check', (req, res, next) => {
	res.status(StatusCodes.OK).send({ sessionActive: req.isAuthenticated() });
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     tags: [Passport]
 *     summary: Logs out a user.
 */
router.post('/logout', (req, res, next) => {
	req.logout(function(err) {
		if (err) {
			return next(err);
		}
		res.redirect('/login');
	});
});
export default router;