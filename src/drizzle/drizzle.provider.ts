import { ConfigService } from '@nestjs/config';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { join } from 'path';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';

dotenv.config({
	path: join(__dirname, '../../app.env'),
});

export const DrizzleAsyncProvider = 'drizzleProvider';

export default [
	{
		provide: DrizzleAsyncProvider,
		inject: [ConfigService],
		useFactory: (configService: ConfigService) => {
			const pool = new Pool({
				connectionString: configService.get<string>('DATABASE_URL'),
			});

			const db = drizzle(pool, { schema, logger: true });

			return db;
		},
		exports: [DrizzleAsyncProvider],
	},
];

export function createDbConnection(config: PoolConfig = {}) {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		...config,
	});

	const db = drizzle(pool, { schema });

	return { db, pool };
}
