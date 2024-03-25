import { randomUUID } from 'crypto';

export function generateTemporaryUserEmail() {
	return `test${randomUUID()}@expresswebapptemplate.com`
}