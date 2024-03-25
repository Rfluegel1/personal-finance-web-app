export class NotFoundException extends Error {
    constructor(id: string) {
        super(`Object not found for id=${id}`)
        this.name = 'NotFoundException'
    }
}