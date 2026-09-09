import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { existsSync } from 'fs';
import { join } from 'path';
import { createDbConnection } from './drizzle.provider';

const envFilePath = join(__dirname, '../../.env');

dotenvExpand.expand(
	dotenv.config({
		path: envFilePath,
	}),
);

const { pool, db } = createDbConnection({ max: 1 });

async function migrateDB() {
	// This will run migrations on the database, skipping the ones already applied
	// cwd is apps/api under `npm run -w`, repo root under the prod entrypoint
	const migrationsFolder = existsSync('./drizzle') ? './drizzle' : './apps/api/drizzle';
	await migrate(db, { migrationsFolder: join(migrationsFolder) });

	// Don't forget to close the connection, otherwise the script will hang
	await pool.end();
}

migrateDB();
