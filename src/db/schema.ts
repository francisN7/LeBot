import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * Ids dos gêneros de fábrica. A migração `0002` insere estas linhas; o dono
 * pode renomear, recolorir e excluir como qualquer outro gênero.
 */
export const defaultGenreIds = [
  'fantasy',
  'romance',
  'nonfiction',
  'classic',
  'children',
  'horror',
] as const;

/** Status de leitura de um livro. */
export const readingStatuses = [
  'reading',
  'queued',
  'paused',
  'finished',
] as const;

export type ReadingStatus = (typeof readingStatuses)[number];

export const genres = sqliteTable(
  'genres',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /** Hex `#RRGGBB` usado no tema claro. */
    colorLight: text('color_light').notNull(),
    /** Par do tema escuro; guardado desde já, usado quando o tema chegar. */
    colorDark: text('color_dark').notNull(),
    /** 0–9 quando a cor veio da paleta; `NULL` para cor personalizada. */
    paletteIndex: integer('palette_index'),
    isDefault: integer('is_default', { mode: 'boolean' })
      .notNull()
      .default(false),
    sortOrder: integer('sort_order').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('genres_name_unique').on(table.name),
    index('genres_sort_order_idx').on(table.sortOrder),
  ],
);

export type GenreRow = typeof genres.$inferSelect;
export type NewGenreRow = typeof genres.$inferInsert;

export const books = sqliteTable(
  'books',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    /** `genres.id`. Sem FK física: a integridade fica no repositório. */
    genreId: text('genre').notNull(),
    status: text('status', { enum: readingStatuses }).notNull(),
    pages: integer('pages').notNull(),
    pagesRead: integer('pages_read').notNull().default(0),
    /** ISBN-10 ou ISBN-13 já normalizado (só dígitos e X). Nulo quando não há. */
    isbn: text('isbn').unique(),
    /** Caminho local da capa (`documentDirectory/covers/<id>.jpg`). */
    coverUri: text('cover_uri'),
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

/**
 * Histórico de leitura: cada registro é o que o dono leu num dia.
 * `books.pages_read` é a soma dessas sessões, mantida pelo repositório.
 */
export const readingSessions = sqliteTable(
  'reading_sessions',
  {
    id: text('id').primaryKey(),
    /** `books.id`. Sem FK física: a integridade fica no repositório. */
    bookId: text('book_id').notNull(),
    pages: integer('pages').notNull(),
    /** Dia da leitura (não o momento em que o registro foi salvo). */
    readAt: integer('read_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('reading_sessions_book_idx').on(table.bookId),
    check('reading_sessions_pages_positive', sql`${table.pages} > 0`),
  ],
);

export type ReadingSessionRow = typeof readingSessions.$inferSelect;
export type NewReadingSessionRow = typeof readingSessions.$inferInsert;

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type SettingRow = typeof settings.$inferSelect;
