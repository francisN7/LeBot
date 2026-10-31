import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';
import type { DeviceDatabase } from './types';

export const DATABASE_NAME = 'lebot.db';

let instance: DeviceDatabase | undefined;

/**
 * Abre (uma única vez) o banco do aparelho e devolve a instância do Drizzle.
 * Fica lazy para que importar o módulo não abra o banco em testes.
 */
export function getDb(): DeviceDatabase {
  if (!instance) {
    const sqlite = openDatabaseSync(DATABASE_NAME);
    sqlite.execSync('PRAGMA journal_mode = WAL;');
    sqlite.execSync('PRAGMA foreign_keys = ON;');
    instance = drizzle(sqlite, { schema });
  }

  return instance;
}

/** Só para testes: evita reutilizar uma conexão aberta por outro teste. */
export function resetDbForTests(): void {
  instance = undefined;
}
