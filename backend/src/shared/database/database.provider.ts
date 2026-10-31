import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { CONFIG } from '../config';

export const DB_CLIENT = 'DB_CLIENT';
export const DIRECT_DB_CLIENT = 'DIRECT_DB_CLIENT';

// Runtime API pooled connection (port 6543, prepare: false)
export const queryClient = postgres(CONFIG.databaseUrl, {
  prepare: false,
  max: CONFIG.dbPoolMax,
});

export const db: PostgresJsDatabase = drizzle(queryClient);

// Direct / session connection for migrations & background tasks (port 5432)
export const directQueryClient = postgres(CONFIG.databaseUrlDirect, {
  prepare: true,
  max: 5,
});

export const directDb: PostgresJsDatabase = drizzle(directQueryClient);

export async function runInTransaction<T>(
  callback: (tx: PostgresJsDatabase) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx as unknown as PostgresJsDatabase);
  });
}
