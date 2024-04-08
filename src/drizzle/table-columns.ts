import { getTableColumns } from 'drizzle-orm';
import * as schema from './schema';

export const usersTableColumns = getTableColumns(schema.users);
