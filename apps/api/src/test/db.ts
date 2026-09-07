import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { existsSync as exists, readFileSync } from 'fs';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema';

/**
 * shared helper for the real-db integration specs: a drizzle instance over
 * DATABASE_TEST_URL with migrations applied once per run and a truncation
 * helper for isolation between tests
 */

const env = Object.fromEntries(
	readFileSync(exists('.env') ? '.env' : '../../.env', 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trim().startsWith('#'))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);

const expand = (value: string) => value.replace(/\$\{(\w+)\}/g, (_, name) => env[name] ?? '');

export const TEST_DATABASE_URL =
	expand(env.DATABASE_TEST_URL) ?? 'postgresql://postgres:postgres@localhost:5431/streamy';

const pool = new Pool({ connectionString: TEST_DATABASE_URL, max: 5 });

export const db = drizzle(pool, { schema });

let migrated: Promise<void> | undefined;

export function ensureMigrated(): Promise<void> {
	migrated ??= migrate(db, { migrationsFolder: './drizzle' });
	return migrated;
}

/** wipes all app tables (test db only!) */
export async function resetDb(): Promise<void> {
	await pool.query(
		`TRUNCATE TABLE comments, tags_videos, tags, playlists_videos, playlists, subtitles, videos, subscriptions, files, channels, users RESTART IDENTITY CASCADE`,
	);
}

export async function closeDb(): Promise<void> {
	await pool.end();
}
