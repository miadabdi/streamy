import { Pool } from 'pg';
import * as schema from '../drizzle/schema';
export declare const TEST_DATABASE_URL: string;
export declare const db: import('drizzle-orm/node-postgres').NodePgDatabase<typeof schema> & {
	$client: Pool;
};
export declare function ensureMigrated(): Promise<void>;
export declare function resetDb(): Promise<void>;
export declare function closeDb(): Promise<void>;
