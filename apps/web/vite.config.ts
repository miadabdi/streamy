import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			'/api': 'http://localhost:3000',
			'/storage': 'http://localhost:9002',
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: 'src/test/setup.ts',
	},
});
