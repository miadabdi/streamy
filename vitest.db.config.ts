import { defineConfig } from 'vitest/config';

/**
 * real-database integration tier: runs *.db-spec.ts against the
 * streamy_db_test compose service (DATABASE_TEST_URL, port 5431).
 * bring it up with: docker compose -f docker-compose-dev.yml up -d streamy_db_test
 */
export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.db-spec.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],
		hookTimeout: 60_000,
		testTimeout: 30_000,
	},
});
