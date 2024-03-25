export class DuplicateRowException extends Error {
	constructor(constraint: string) {
		super(`Duplicate key value violates unique constraint=${constraint}`)
		this.name = 'DuplicateRowException'
	}
}