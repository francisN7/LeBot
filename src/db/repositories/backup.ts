import { asc, inArray } from 'drizzle-orm';

import {
  type BookRow,
  books,
  type GenreRow,
  genres,
  type QueueItemRow,
  queueItems,
  type ReadingSessionRow,
  type ReviewFieldRow,
  type ReviewRow,
  readingSessions,
  reviewFields,
  reviews,
  type SettingRow,
  settings,
} from '../schema';
import { SEED_FLAG, SEED_VERSION } from '../seed';
import type { AppDatabase } from '../types';

/** Todas as tabelas do backup, já com `Date` em vez de texto ISO. */
export type BackupTables = {
  genres: GenreRow[];
  reviewFields: ReviewFieldRow[];
  books: BookRow[];
  readingSessions: ReadingSessionRow[];
  queueItems: QueueItemRow[];
  reviews: ReviewRow[];
  settings: SettingRow[];
};

export type BackupCounts = {
  books: number;
  sessions: number;
  reviews: number;
  genres: number;
  reviewFields: number;
  queueItems: number;
  settings: number;
};

export type BackupRepository = {
  /** Linhas de todas as tabelas; a fila sai só com o que é visível. */
  exportAll(): BackupTables;
  /** Contagens do banco atual para a confirmação da importação. */
  counts(): BackupCounts;
  /** Apaga tudo e insere o backup numa transação. */
  replaceAll(tables: BackupTables): void;
  /** Depois de uma capa não gravada, o livro fica sem ela em vez de apontar para o vazio. */
  clearCoverUris(bookIds: readonly string[]): void;
};

function effectiveQueue(
  bookRows: readonly BookRow[],
  stored: readonly QueueItemRow[],
): QueueItemRow[] {
  const valid = new Set(
    bookRows
      .filter((book) => book.status !== 'finished')
      .map((book) => book.id),
  );

  return stored
    .filter((row) => valid.has(row.bookId))
    .sort(
      (first, second) =>
        first.position - second.position ||
        first.bookId.localeCompare(second.bookId),
    )
    .map((row, position) => ({ ...row, position }));
}

export function createBackupRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): BackupRepository {
  const repository: BackupRepository = {
    exportAll() {
      const bookRows = db
        .select()
        .from(books)
        .orderBy(asc(books.createdAt), asc(books.id))
        .all();

      return {
        genres: db
          .select()
          .from(genres)
          .orderBy(asc(genres.sortOrder), asc(genres.id))
          .all(),
        reviewFields: db
          .select()
          .from(reviewFields)
          .orderBy(asc(reviewFields.sortOrder), asc(reviewFields.id))
          .all(),
        books: bookRows,
        readingSessions: db
          .select()
          .from(readingSessions)
          .orderBy(asc(readingSessions.readAt), asc(readingSessions.id))
          .all(),
        queueItems: effectiveQueue(
          bookRows,
          db
            .select()
            .from(queueItems)
            .orderBy(asc(queueItems.position), asc(queueItems.bookId))
            .all(),
        ),
        reviews: db.select().from(reviews).orderBy(asc(reviews.bookId)).all(),
        settings: db.select().from(settings).orderBy(asc(settings.key)).all(),
      };
    },

    counts() {
      const tables = repository.exportAll();

      return {
        books: tables.books.length,
        sessions: tables.readingSessions.length,
        reviews: tables.reviews.length,
        genres: tables.genres.length,
        reviewFields: tables.reviewFields.length,
        queueItems: tables.queueItems.length,
        settings: tables.settings.length,
      };
    },

    replaceAll(tables) {
      db.transaction((tx) => {
        // Sem FK física: apaga na ordem inversa da dependência lógica.
        tx.delete(reviews).run();
        tx.delete(readingSessions).run();
        tx.delete(queueItems).run();
        tx.delete(books).run();
        tx.delete(reviewFields).run();
        tx.delete(genres).run();
        tx.delete(settings).run();

        for (const row of tables.genres) {
          tx.insert(genres).values(row).run();
        }

        for (const row of tables.reviewFields) {
          tx.insert(reviewFields).values(row).run();
        }

        for (const row of tables.books) {
          tx.insert(books).values(row).run();
        }

        for (const row of tables.readingSessions) {
          tx.insert(readingSessions).values(row).run();
        }

        for (const row of tables.queueItems) {
          tx.insert(queueItems).values(row).run();
        }

        for (const row of tables.reviews) {
          tx.insert(reviews).values(row).run();
        }

        const settingRows = tables.settings.filter(
          (row) => row.key !== SEED_FLAG,
        );

        // Sem o flag, um backup vazio semearia os livros de exemplo no próximo boot.
        settingRows.push({ key: SEED_FLAG, value: SEED_VERSION });

        for (const row of settingRows) {
          tx.insert(settings).values(row).run();
        }
      });
    },

    clearCoverUris(bookIds) {
      if (bookIds.length === 0) {
        return;
      }

      db.update(books)
        .set({ coverUri: null })
        .where(inArray(books.id, [...bookIds]))
        .run();
    },
  };

  return repository;
}
