import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { settings } from '../schema';
import type { AppDatabase } from '../types';

const settingKeySchema = z.string().trim().min(1);

export type SettingsRepository = {
  get(key: string): string | undefined;
  all(): Record<string, string>;
  set(key: string, value: string): void;
  remove(key: string): boolean;
};

export function createSettingsRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): SettingsRepository {
  return {
    get(key) {
      return db
        .select()
        .from(settings)
        .where(eq(settings.key, settingKeySchema.parse(key)))
        .get()?.value;
    },

    all() {
      return Object.fromEntries(
        db
          .select()
          .from(settings)
          .all()
          .map((row) => [row.key, row.value]),
      );
    },

    set(key, value) {
      const parsedKey = settingKeySchema.parse(key);

      db.insert(settings)
        .values({ key: parsedKey, value: z.string().parse(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
        .run();
    },

    remove(key) {
      const deleted = db
        .delete(settings)
        .where(eq(settings.key, settingKeySchema.parse(key)))
        .returning({ key: settings.key })
        .all();

      return deleted.length > 0;
    },
  };
}
