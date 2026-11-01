import { z } from 'zod';
import {
  FIELD_NAME_MAX,
  normalizeReviewFieldName,
} from '@/db/repositories/review-fields';
import { normalizeExtras } from '@/db/repositories/reviews';
import type {
  BookRow,
  GenreRow,
  QueueItemRow,
  ReadingSessionRow,
  ReviewFieldRow,
  ReviewRow,
  SettingRow,
} from '@/db/schema';
import { readingStatuses } from '@/db/schema';
import { MAX_GOAL_PAGES, MIN_GOAL_PAGES } from '@/features/planner';
import { coverFileName } from '@/lib/covers';
import { toLocalDayKey } from '@/lib/day';
import { isHexColor } from '@/lib/genre-color';
import { normalizeGenreName } from '@/lib/genre-name';
import { isValidIsbn, normalizeIsbn } from '@/lib/isbn';

import {
  BACKUP_FORMAT_VERSION,
  BACKUP_ID_PATTERN,
  type BackupCounts,
  type BackupMeta,
  type BackupTables,
} from './types';

const LAST_EXPORT_KEY = 'backup.last_exported_at';
const COVERS_PREFIX = 'covers/';

const idSchema = z.string().regex(BACKUP_ID_PATTERN, 'Identificador inválido');

const timestampSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const genreSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(FIELD_NAME_MAX),
    color_light: z.string().trim().refine(isHexColor, 'Cor inválida'),
    color_dark: z.string().trim().refine(isHexColor, 'Cor inválida'),
    palette_index: z.number().int().min(0).max(9).nullable(),
    is_default: z.boolean(),
    sort_order: z.number().int().nonnegative(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform(
    (row): GenreRow => ({
      id: row.id,
      name: row.name,
      colorLight: row.color_light.toUpperCase(),
      colorDark: row.color_dark.toUpperCase(),
      paletteIndex: row.palette_index,
      isDefault: row.is_default,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const reviewFieldSchema = z
  .object({
    id: idSchema,
    name: z
      .string()
      .trim()
      .min(1)
      .max(FIELD_NAME_MAX, `Use até ${FIELD_NAME_MAX} caracteres`),
    sort_order: z.number().int().nonnegative(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform(
    (row): ReviewFieldRow => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const bookSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(1),
    author: z.string().trim().min(1),
    genre: idSchema,
    status: z.enum(readingStatuses),
    pages: z.number().int().positive(),
    pages_read: z.number().int().nonnegative(),
    isbn: z.string().nullable(),
    cover_uri: z.string().nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform(
    (row): BookRow => ({
      id: row.id,
      title: row.title,
      author: row.author,
      genreId: row.genre,
      status: row.status,
      pages: row.pages,
      pagesRead: row.pages_read,
      isbn: row.isbn,
      coverUri: row.cover_uri,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const readingSessionSchema = z
  .object({
    id: idSchema,
    book_id: idSchema,
    pages: z.number().int().positive(),
    read_at: timestampSchema,
    applied_pages: z.number().int().nonnegative().nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform(
    (row): ReadingSessionRow => ({
      id: row.id,
      bookId: row.book_id,
      pages: row.pages,
      readAt: row.read_at,
      appliedPages: row.applied_pages,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const queueItemSchema = z
  .object({
    book_id: idSchema,
    position: z.number().int().nonnegative(),
    note: z.string().nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform(
    (row): QueueItemRow => ({
      bookId: row.book_id,
      position: row.position,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const reviewSchema = z
  .object({
    book_id: idSchema,
    rating: z.number().int().min(1).max(5),
    text: z.string().nullable(),
    quote: z.string().nullable(),
    extras: z.record(idSchema, z.string().trim().min(1)),
    created_at: timestampSchema,
    updated_at: timestampSchema,
  })
  .transform(
    (row): ReviewRow => ({
      bookId: row.book_id,
      rating: row.rating,
      text: row.text,
      quote: row.quote,
      extras: normalizeExtras(row.extras),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const settingSchema = z
  .object({
    key: z.string().trim().min(1).max(100),
    value: z.string(),
  })
  .transform(
    (row): SettingRow => ({
      key: row.key,
      value: row.value,
    }),
  );

const envelopeSchema = z.object({
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  appVersion: z.string().trim().min(1),
  exportedAt: timestampSchema,
  data: z.object({
    genres: z.array(genreSchema),
    review_fields: z.array(reviewFieldSchema),
    books: z.array(bookSchema),
    reading_sessions: z.array(readingSessionSchema),
    queue_items: z.array(queueItemSchema),
    reviews: z.array(reviewSchema),
    settings: z.array(settingSchema),
  }),
});

export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

const tableLabels: Record<string, string> = {
  genres: 'Gênero',
  review_fields: 'Campo de resenha',
  books: 'Livro',
  reading_sessions: 'Sessão',
  queue_items: 'Item da ordem',
  reviews: 'Resenha',
  settings: 'Preferência',
};

function describePath(path: readonly PropertyKey[]): string {
  const [root, table, index, field] = path;

  if (
    root === 'data' &&
    typeof table === 'string' &&
    typeof index === 'number'
  ) {
    const label = tableLabels[table] ?? table;
    return `${label} ${index + 1}${typeof field === 'string' ? ` (${field})` : ''}`;
  }

  return 'cabeçalho do backup';
}

function formatIssues(error: z.ZodError): string {
  const issue = error.issues[0];

  if (!issue) {
    return 'O arquivo do backup não tem o formato esperado.';
  }

  return `O backup tem um campo inválido em ${describePath(issue.path)}. O arquivo pode estar corrompido.`;
}

function portableCount(tables: BackupTables): BackupCounts {
  return {
    books: tables.books.length,
    sessions: tables.readingSessions.length,
    reviews: tables.reviews.length,
    genres: tables.genres.length,
    reviewFields: tables.reviewFields.length,
    queueItems: tables.queueItems.length,
    settings: tables.settings.length,
  };
}

export function countBackup(tables: BackupTables): BackupCounts {
  return portableCount(tables);
}

/** Converte as linhas do banco no JSON portátil, com datas ISO e capas relativas. */
export function serializeBackup(
  tables: BackupTables,
  meta: BackupMeta,
  coverBookIds: ReadonlySet<string>,
): string {
  const exportedAt = meta.exportedAt.toISOString();
  const settings = tables.settings
    .filter((row) => row.key !== LAST_EXPORT_KEY)
    .concat({ key: LAST_EXPORT_KEY, value: exportedAt })
    .sort((first, second) => first.key.localeCompare(second.key));

  const payload = {
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: meta.appVersion,
    exportedAt,
    data: {
      genres: tables.genres.map((row) => ({
        id: row.id,
        name: row.name,
        color_light: row.colorLight,
        color_dark: row.colorDark,
        palette_index: row.paletteIndex,
        is_default: row.isDefault,
        sort_order: row.sortOrder,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      })),
      review_fields: tables.reviewFields.map((row) => ({
        id: row.id,
        name: row.name,
        sort_order: row.sortOrder,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      })),
      books: tables.books.map((row) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        genre: row.genreId,
        status: row.status,
        pages: row.pages,
        pages_read: row.pagesRead,
        isbn: row.isbn,
        cover_uri: coverBookIds.has(row.id)
          ? `${COVERS_PREFIX}${coverFileName(row.id)}`
          : null,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      })),
      reading_sessions: tables.readingSessions.map((row) => ({
        id: row.id,
        book_id: row.bookId,
        pages: row.pages,
        read_at: row.readAt.toISOString(),
        applied_pages: row.appliedPages,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      })),
      queue_items: tables.queueItems.map((row) => ({
        book_id: row.bookId,
        position: row.position,
        note: row.note,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      })),
      reviews: tables.reviews.map((row) => ({
        book_id: row.bookId,
        rating: row.rating,
        text: row.text,
        quote: row.quote,
        extras: row.extras,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      })),
      settings: settings.map((row) => ({ key: row.key, value: row.value })),
    },
  };

  return JSON.stringify(payload, null, 2);
}

export type ParsedBackup = {
  tables: BackupTables;
  exportedAt: Date;
  appVersion: string;
};

/** Lê o JSON e valida a forma; as regras entre tabelas ficam em `validateBackup`. */
export function parseBackup(json: string): ParsedBackup {
  let raw: unknown;

  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupFormatError(
      'O arquivo não é um JSON válido. Escolha um backup exportado pelo LêBot.',
    );
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BackupFormatError(
      'O arquivo não tem o formato de um backup do LêBot.',
    );
  }

  const version = (raw as { formatVersion?: unknown }).formatVersion;

  if (typeof version !== 'number') {
    throw new BackupFormatError(
      'Este arquivo não tem versão de backup. Escolha um backup do LêBot.',
    );
  }

  if (version !== BACKUP_FORMAT_VERSION) {
    throw new BackupFormatError(
      `Este backup usa o formato ${version}; esta versão do LêBot só restaura o formato ${BACKUP_FORMAT_VERSION}.`,
    );
  }

  const parsed = envelopeSchema.safeParse(raw);

  if (!parsed.success) {
    throw new BackupFormatError(formatIssues(parsed.error));
  }

  const data = parsed.data.data;

  return {
    appVersion: parsed.data.appVersion,
    exportedAt: parsed.data.exportedAt,
    tables: {
      genres: data.genres,
      reviewFields: data.review_fields,
      books: data.books,
      readingSessions: data.reading_sessions,
      queueItems: data.queue_items,
      reviews: data.reviews,
      settings: data.settings,
    },
  };
}

function assertUnique(values: readonly string[], message: string): void {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new BackupFormatError(message);
    }

    seen.add(value);
  }
}

function normalizedUnique(
  values: readonly string[],
  normalize: (value: string) => string,
  message: string,
): void {
  assertUnique(values.map(normalize), message);
}

function assertCoverPath(book: BookRow, coverIds: ReadonlySet<string>): void {
  if (book.coverUri === null) {
    if (coverIds.has(book.id)) {
      throw new BackupFormatError(
        `O backup tem uma capa para "${book.title}" sem o livro apontar para ela.`,
      );
    }

    return;
  }

  const expected = `${COVERS_PREFIX}${coverFileName(book.id)}`;

  if (book.coverUri !== expected) {
    throw new BackupFormatError(
      `A capa de "${book.title}" está num caminho inesperado no backup.`,
    );
  }

  if (!coverIds.has(book.id)) {
    throw new BackupFormatError(
      `A capa de "${book.title}" não está dentro do arquivo do backup.`,
    );
  }
}

/**
 * Regras que dependem de mais de uma linha: ids, ISBNs, nomes repetidos,
 * referências entre tabelas, meta e capas.
 */
export function validateBackup(
  tables: BackupTables,
  coverIds: ReadonlySet<string> = new Set(),
): void {
  if (tables.genres.length === 0) {
    throw new BackupFormatError('O backup não tem nenhum gênero.');
  }

  assertUnique(
    tables.books.map((book) => book.id),
    'O backup tem dois livros com o mesmo identificador.',
  );
  assertUnique(
    tables.genres.map((genre) => genre.id),
    'O backup tem dois gêneros com o mesmo identificador.',
  );
  assertUnique(
    tables.reviewFields.map((field) => field.id),
    'O backup tem dois campos de resenha com o mesmo identificador.',
  );
  assertUnique(
    tables.readingSessions.map((session) => session.id),
    'O backup tem duas sessões com o mesmo identificador.',
  );
  assertUnique(
    tables.settings.map((row) => row.key),
    'O backup tem duas preferências com a mesma chave.',
  );
  assertUnique(
    tables.queueItems.map((row) => row.bookId),
    'O backup tem o mesmo livro duas vezes na ordem.',
  );

  normalizedUnique(
    tables.genres.map((genre) => genre.name),
    normalizeGenreName,
    'O backup tem dois gêneros com o mesmo nome.',
  );
  normalizedUnique(
    tables.reviewFields.map((field) => field.name),
    normalizeReviewFieldName,
    'O backup tem dois campos de resenha com o mesmo nome.',
  );

  const isbns = tables.books
    .map((book) => book.isbn)
    .filter((isbn): isbn is string => isbn !== null);
  assertUnique(isbns, 'O backup tem dois livros com o mesmo ISBN.');

  const genreById = new Map(
    tables.genres.map((genre) => [genre.id, genre] as const),
  );
  const bookById = new Map(
    tables.books.map((book) => [book.id, book] as const),
  );
  const fieldIds = new Set(tables.reviewFields.map((field) => field.id));

  for (const book of tables.books) {
    if (!genreById.has(book.genreId)) {
      throw new BackupFormatError(
        `O livro "${book.title}" aponta para um gênero que não está no backup.`,
      );
    }

    if (book.pagesRead > book.pages) {
      throw new BackupFormatError(
        `O livro "${book.title}" tem mais páginas lidas que o total.`,
      );
    }

    if (book.status === 'finished' && book.pagesRead !== book.pages) {
      throw new BackupFormatError(
        `O livro "${book.title}" está concluído, mas não chegou ao total de páginas.`,
      );
    }

    if (book.isbn !== null) {
      const normalized = normalizeIsbn(book.isbn);

      if (normalized !== book.isbn || !isValidIsbn(book.isbn)) {
        throw new BackupFormatError(
          `O ISBN do livro "${book.title}" está inválido.`,
        );
      }
    }

    assertCoverPath(book, coverIds);
  }

  const booksWithCover = new Set(
    tables.books
      .filter((book) => book.coverUri !== null)
      .map((book) => book.id),
  );

  for (const bookId of coverIds) {
    if (!booksWithCover.has(bookId)) {
      throw new BackupFormatError(
        'O backup tem uma capa que não pertence a nenhum livro.',
      );
    }
  }

  for (const session of tables.readingSessions) {
    if (session.appliedPages !== null && session.appliedPages > session.pages) {
      throw new BackupFormatError(
        'O backup tem uma sessão com mais páginas aplicadas do que lidas.',
      );
    }
  }

  for (const item of tables.queueItems) {
    const book = bookById.get(item.bookId);

    if (!book) {
      throw new BackupFormatError(
        'O backup tem um item de ordem para um livro que não existe.',
      );
    }

    if (book.status === 'finished') {
      throw new BackupFormatError(
        `O backup tem "${book.title}" na ordem mesmo estando concluído.`,
      );
    }
  }

  for (const review of tables.reviews) {
    if (!bookById.has(review.bookId)) {
      throw new BackupFormatError(
        'O backup tem uma resenha para um livro que não existe.',
      );
    }

    for (const key of Object.keys(review.extras)) {
      if (!fieldIds.has(key)) {
        throw new BackupFormatError(
          'O backup tem um valor de resenha para um campo que não existe.',
        );
      }
    }
  }

  const goal = tables.settings.find((row) => row.key === 'goal.pages');

  if (goal) {
    const pages = Number(goal.value);

    if (
      !Number.isInteger(pages) ||
      pages < MIN_GOAL_PAGES ||
      pages > MAX_GOAL_PAGES
    ) {
      throw new BackupFormatError(
        `A meta diária do backup precisa ficar entre ${MIN_GOAL_PAGES} e ${MAX_GOAL_PAGES} páginas.`,
      );
    }
  }
}

/** Troca o caminho relativo do arquivo pelos caminhos finais no aparelho. */
export function withCoverUris(
  tables: BackupTables,
  uriByBook: ReadonlyMap<string, string>,
): BackupTables {
  return {
    ...tables,
    books: tables.books.map((book) => ({
      ...book,
      coverUri:
        book.coverUri === null ? null : (uriByBook.get(book.id) ?? null),
    })),
  };
}

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

/** Data do último backup em PT-BR, sem depender do locale do aparelho. */
export function formatBackupDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}, ${hours}:${minutes}`;
}

export function backupFileName(date: Date): string {
  return `lebot-backup-${toLocalDayKey(date)}.zip`;
}
