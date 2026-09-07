import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
export declare const DrizzleAsyncProvider = 'drizzleProvider';
declare const _default: {
	provide: string;
	inject: (typeof ConfigService)[];
	useFactory: (configService: ConfigService) => import('drizzle-orm/node-postgres').NodePgDatabase<
		typeof schema
	> & {
		$client: Pool;
	};
	exports: string[];
}[];
export default _default;
export declare function createDbConnection(config?: PoolConfig): {
	db: import('drizzle-orm/node-postgres').NodePgDatabase<typeof schema> & {
		$client: Pool;
	};
	pool: Pool;
};
