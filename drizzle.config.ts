import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
	schema: './src/drizzle/schema.ts',
	out: './drizzle',
	driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
	dbCredentials: {
		connectionString: process.env.DATABASE_URL,
	},
} satisfies Config;
