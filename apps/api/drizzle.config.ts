import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import type { Config } from 'drizzle-kit';
import { join } from 'path';

const envFilePath = join(__dirname, '.env');

dotenvExpand.expand(
	dotenv.config({
		path: envFilePath,
	}),
);

export default {
	schema: './src/drizzle/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
} satisfies Config;
