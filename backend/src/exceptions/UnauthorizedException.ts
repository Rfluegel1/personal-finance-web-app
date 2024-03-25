export class UnauthorizedException extends Error {
    constructor(action: string) {
        super(`Unauthorized: You must be logged in to perform action=${action}.`)
        this.name = 'UnauthorizedException'
    }
}