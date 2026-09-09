import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			'/api': 'http://localhost:3000',
			'/storage': {
				target: 'http://localhost:9002',
				rewrite: (path) => path.replace(/^\/storage/, ''),
			},
			// the worker is a separate origin (:3001); strip the prefix the same
			// way /storage does — the worker's own routes are /api/v1/health/…
			'/worker-api': {
				target: 'http://localhost:3001',
				rewrite: (path) => path.replace(/^\/worker-api/, ''),
			},
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: 'src/test/setup.ts',
		// one jsdom fork per file; a fork per core oversubscribes a dev box and
		// tips timing-sensitive tests (userEvent typing) past their timeouts
		maxWorkers: '50%',
	},
});
