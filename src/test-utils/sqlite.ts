import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs from 'sql.js';

import * as schema from '@/db/schema';

/** Banco de teste (SQLite em memória via wasm). */
export type TestDatabase = SQLJsDatabase<typeof schema>;

/** Roda as migrações reais; chamar de novo deve ser idempotente. */
export function runMigrations(db: TestDatabase): void {
  migrate(db, { migrationsFolder: 'drizzle' });
}

/** Banco de teste já migrado. Precisa de `await` (wasm do sql.js). */
export async function createTestDatabase(): Promise<TestDatabase> {
  const SQL = await initSqlJs();
  const db = drizzle(new SQL.Database(), { schema });
  runMigrations(db);
  return db;
}
