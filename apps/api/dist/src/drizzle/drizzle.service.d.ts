import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
export declare class DrizzleService {
	readonly db: NodePgDatabase<typeof schema>;
	constructor(db: NodePgDatabase<typeof schema>);
}
