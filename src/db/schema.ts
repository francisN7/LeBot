import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Gêneros do app. A UI usa os mesmos valores para colorir a lombada. */
export const bookGenres = [
  'fantasy',
  'romance',
  'nonfiction',
  'classic',
  'children',
  'horror',
] as const;

export type BookGenre = (typeof bookGenres)[number];

/** Status de leitura de um livro. */
export const readingStatuses = [
  'reading',
  'queued',
  'paused',
  'finished',
] as const;

export type ReadingStatus = (typeof readingStatuses)[number];

export const books = sqliteTable(
  'books',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    genre: text('genre', { enum: bookGenres }).notNull(),
    status: text('status', { enum: readingStatuses }).notNull(),
    pages: integer('pages').notNull(),
    pagesRead: integer('pages_read').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    check('books_pages_positive', sql`${table.pages} > 0`),
    check(
      'books_pages_read_range',
      sql`${table.pagesRead} >= 0 AND ${table.pagesRead} <= ${table.pages}`,
    ),
  ],
);

export type BookRow = typeof books.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type SettingRow = typeof settings.$inferSelect;
