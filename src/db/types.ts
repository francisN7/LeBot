import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/** Banco do aparelho, aberto pelo `expo-sqlite`. */
export type DeviceDatabase = ExpoSQLiteDatabase<typeof schema>;

/**
 * Contrato que os repositórios enxergam. `TRunResult` varia entre `expo-sqlite`
 * e o `sql.js` dos testes; o repositório não usa o retorno de escrita.
 */
export type AppDatabase<TRunResult = unknown> = BaseSQLiteDatabase<
  'sync',
  TRunResult,
  typeof schema
>;
