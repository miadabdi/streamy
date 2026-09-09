import { parseCorsOrigins } from './cors-origins';

describe('parseCorsOrigins', () => {
	it('returns an empty list when the variable is unset', () => {
		expect(parseCorsOrigins(undefined)).toEqual([]);
	});

	it('returns an empty list when the variable is empty or whitespace-only', () => {
		expect(parseCorsOrigins('')).toEqual([]);
		expect(parseCorsOrigins('   ')).toEqual([]);
	});

	it('parses a comma-separated list, trimming whitespace and dropping empties', () => {
		expect(parseCorsOrigins('https://a.example , https://b.example,,https://c.example')).toEqual([
			'https://a.example',
			'https://b.example',
			'https://c.example',
		]);
	});
});
