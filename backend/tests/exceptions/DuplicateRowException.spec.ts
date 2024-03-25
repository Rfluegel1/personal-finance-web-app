import { DuplicateRowException } from '../../src/exceptions/DuplicateRowException';

describe('custom duplicate exception', () => {
	it('constructor returns message and sets name', async () => {
		// when
		const dummyFunction = () => {
			throw new DuplicateRowException('constraint')
		}
		// then
		expect(dummyFunction).toThrow('Duplicate key value violates unique constraint=constraint')
	})
})