import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.spec.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts'],
			thresholds: { lines: 25, functions: 20 },
		},
	},
});
