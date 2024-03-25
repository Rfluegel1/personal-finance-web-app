import {NextFunction, Request, Response} from 'express'
import {StatusCodes} from 'http-status-codes'
import {getLogger} from '../logger'
import TodoService from './TodoService'
import Todo from './Todo'
import {UnauthorizedException} from '../exceptions/UnauthorizedException'
import User from '../users/User'
import { checkForHtml, validateRequest } from '../utils';
import Joi from 'joi';

export default class TodoController {
    todoService = new TodoService()

    validationSchema = Joi.object({
        id: Joi.string().uuid(),
        task: Joi.string().max(255).custom(checkForHtml()),
        createdBy: Joi.string().uuid(),
    });

    async createTodo(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received create todos request', {requestBody: request.body})
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('create todo'))
        }
        let task: string = request.body.task
        let createdBy: string = (request.user as User).id
        validateRequest(request, next, this.validationSchema)
        try {
            const todo: Todo = await this.todoService.createTodo(task, createdBy)
            getLogger().info('Sending create todos response', {status: StatusCodes.CREATED})
            return response.status(StatusCodes.CREATED).send({
                message: todo
            })
        } catch (error) {
            next(error)
        }
    }

    async deleteTodo(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received delete todos request', {requestParam: request.params})
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('delete todo'))
        }
        let id: string = request.params.id
        validateRequest(request, next, this.validationSchema)
        try {
            const todo = await this.todoService.getTodo(id)
            if (todo.createdBy !== (request.user as User).id) {
                throw new UnauthorizedException('delete todo')
            }
            await this.todoService.deleteTodo(id)
            getLogger().info('Sending delete todos response', {status: StatusCodes.NO_CONTENT})
            return response.sendStatus(StatusCodes.NO_CONTENT)
        } catch (error) {
            next(error)
        }
    }

    async getTodo(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received get todos request', {requestParam: request.params})
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('get todo'))
        }

        let id: string = request.params.id
        let todo: Todo
        validateRequest(request, next, this.validationSchema)
        try {
            todo = await this.todoService.getTodo(id)
            if (todo.createdBy !== (request.user as User).id) {
                throw new UnauthorizedException('get todo')
            }
            getLogger().info('Sending get todos response', {status: StatusCodes.OK})
            return response.status(StatusCodes.OK).send({
                message: todo
            })
        } catch (error) {
            next(error)
        }
    }

    async getTodosByCreatedBy(request: Request, response: Response, next: NextFunction) {
        getLogger().info('Received get all todos request')
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('get todos by created by'))
        }
        let createdBy: any = (request.user as User).id
        validateRequest(request, next, this.validationSchema)
        try {
            const todos: Todo[] = await this.todoService.getTodosByCreatedBy(createdBy)
            getLogger().info('Sending get all todos request', {status: StatusCodes.OK})
            return response.status(StatusCodes.OK).send({
                message: todos
            })
        } catch (error) {
            next(error)
        }
    }

    async updateTodo(request: Request, res: Response, next: NextFunction) {
        getLogger().info('Received update todos request', {requestParam: request.params, requestBody: request.body})
        if (!request.isAuthenticated()) {
            return next(new UnauthorizedException('update todo'))
        }
        const id: string = request.params.id
        const task: string = request.body.task
        const createdBy: string = request.body.createdBy
        validateRequest(request, next, this.validationSchema)
        try {
            let todo = await this.todoService.getTodo(id)
            if (todo.createdBy !== (request.user as User).id) {
                throw new UnauthorizedException('update todo')
            }
            todo = await this.todoService.updateTodo(id, task, createdBy)
            getLogger().info('Sending update todos request', {status: StatusCodes.OK})
            return res.status(StatusCodes.OK).send({
                message: todo
            })
        } catch (error) {
            next(error)
        }
    }
}

