export class DatabaseException extends Error {
    constructor() {
        super('Error interacting with the database')
        this.name = 'DatabaseException'
    }
}