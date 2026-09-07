import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from './drizzle.provider';
import * as schema from './schema';

@Injectable()
export class DrizzleService {
	constructor(@Inject(DrizzleAsyncProvider) readonly db: NodePgDatabase<typeof schema>) {}
}
