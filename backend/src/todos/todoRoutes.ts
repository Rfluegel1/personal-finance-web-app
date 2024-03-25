import express from 'express';
import TodoController from './TodoController';

const router = express.Router();

let todoController = new TodoController();
/**
 * @swagger
 * tags:
 *   name: Todos
 *   description: Todo management
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:    # For cookies
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *
 * /api/todos:
 *   get:
 *     tags: [Todos]
 *     summary: Returns a list of todos created by authenticated user.
 *     responses:
 *       200:
 *         description: A list of todos.
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
 *                   task:
 *                     type: string
 *                     description: The todos text details.
 *                   createdBy:
 *                     type: string
 *                     description: The user's name.
 */
router.get('/todos', todoController.getTodosByCreatedBy.bind(todoController));

/**
 * @swagger
 * /api/todos/:id:
 *   get:
 *     summary: Returns a todo by id that is created by authenticated user.
 *     tags: [Todos]
 *     parameters:
 *       - in: parameter
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The todo ID.
 *     responses:
 *       200:
 *         description: A todo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 task:
 *                   type: string
 *                   description: The todos text details.
 *                 createdBy:
 *                   type: string
 *                   description: The user's name.
 */
router.get('/todos/:id', todoController.getTodo.bind(todoController));

/**
 * @swagger
 * /api/todos/:id:
 *   put:
 *     summary: Updates a todo by id that is created by authenticated user.
 *     tags: [Todos]
 *     parameters:
 *       - in: parameter
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The todo ID.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                 task:
 *                   type: string
 *                   description: The todos text details.
 *                 createdBy:
 *                   type: string
 *                   description: The user's name.
 *     responses:
 *       200:
 *         description: A todo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The user ID.
 *                 task:
 *                   type: string
 *                   description: The todos text details.
 *                 createdBy:
 *                   type: string
 *                   description: The user's name.
 */
router.put('/todos/:id', todoController.updateTodo.bind(todoController));

/**
 * @swagger
 * /api/todos/:id:
 *   delete:
 *     summary: Deletes a todo by id that is created by authenticated user.
 *     tags: [Todos]
 *     parameters:
 *       - in: parameter
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           description: The todo ID.
 *     responses:
 *       204:
 *         description: Deletes todo.
 */
router.delete('/todos/:id', todoController.deleteTodo.bind(todoController));

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Creates a todo.
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task:
 *                 type: string
 *                 description: The todo's text details.
 *     responses:
 *       201:
 *         description: Successfully created todo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: The todo ID.
 *                 task:
 *                   type: string
 *                   description: The todo's text details.
 *                 createdBy:
 *                   type: string
 *                   description: The name of the user who created the todo.
 */
router.post('/todos', todoController.createTodo.bind(todoController));

export default router