import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDbConnection } from './drizzle.provider';

const { pool, db } = createDbConnection({ max: 1 });

async function migrateDB() {
	// This will run migrations on the database, skipping the ones already applied
	await migrate(db, { migrationsFolder: './drizzle' });

	// Don't forget to close the connection, otherwise the script will hang
	await pool.end();
}

migrateDB();
