import dotenv from 'dotenv';
import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { join } from 'path';

dotenv.config({
	path: join(__dirname, '../../app.env'),
});

export default {
	schema: './src/drizzle/schema.ts',
	out: './drizzle',
	driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
	dbCredentials: {
		connectionString: process.env.DATABASE_URL,
	},
} satisfies Config;
