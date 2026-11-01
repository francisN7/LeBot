import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { books, type QueueItemRow, queueItems } from '../schema';
import type { AppDatabase } from '../types';

export const queueBookIdSchema = z.string().trim().min(1, 'Escolha um livro');

const replaceAllSchema = z.array(queueBookIdSchema);
const positionSchema = z.number().int();

/**
 * Ordem automática: todo livro não concluído entra. Os `reading` formam o bloco
 * de cima (o primeiro é o principal); `queued` e `paused` ficam abaixo. O dono
 * só reordena dentro dos blocos — status é o que coloca o livro na ordem.
 */
export type QueueRepository = {
  /** Ordem atual, incluindo livros ainda sem linha gravada. */
  list(): QueueItemRow[];
  /** Materializa a ordem (insere quem falta e remove concluído/órfão). */
  sync(): QueueItemRow[];
  /** Move dentro do bloco do livro; a tela não deixa cruzar os blocos. */
  move(bookId: string, toPosition: number): QueueItemRow[];
  /** Substitui a ordem dos livros informados, mantendo os blocos. */
  replaceAll(bookIds: readonly string[]): QueueItemRow[];
};

type ValidBook = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function orderedRows<TRunResult>(db: AppDatabase<TRunResult>): QueueItemRow[] {
  return db
    .select()
    .from(queueItems)
    .orderBy(asc(queueItems.position), asc(queueItems.bookId))
    .all();
}

/** Livros que podem aparecer: existem e ainda não foram concluídos. */
function validBooks<TRunResult>(db: AppDatabase<TRunResult>): ValidBook[] {
  return db
    .select({
      id: books.id,
      status: books.status,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
    })
    .from(books)
    .all()
    .filter((book) => book.status !== 'finished')
    .sort(
      (first, second) =>
        first.createdAt.getTime() - second.createdAt.getTime() ||
        first.id.localeCompare(second.id),
    );
}

function isReading(book: ValidBook | undefined): boolean {
  return book?.status === 'reading';
}

function virtualRow(book: ValidBook): QueueItemRow {
  return {
    bookId: book.id,
    position: 0,
    note: null,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

/**
 * Ordem derivada: linhas gravadas primeiro (na posição delas), depois os livros
 * que ainda não têm linha, por criação. Os dois blocos são separados por status.
 * Não grava nada; `sync` e as escritas materializam.
 */
function deriveRows<TRunResult>(db: AppDatabase<TRunResult>): QueueItemRow[] {
  const valid = validBooks(db);
  const validById = new Map(valid.map((book) => [book.id, book] as const));
  const stored = orderedRows(db).filter((row) => validById.has(row.bookId));
  const storedIds = new Set(stored.map((row) => row.bookId));
  const missing = valid.filter((book) => !storedIds.has(book.id));

  function group(reading: boolean): QueueItemRow[] {
    return [
      ...stored.filter(
        (row) => isReading(validById.get(row.bookId)) === reading,
      ),
      ...missing.filter((book) => isReading(book) === reading).map(virtualRow),
    ];
  }

  return [...group(true), ...group(false)].map((row, position) => ({
    ...row,
    position,
  }));
}

/**
 * Reescreve `position` de 0..n-1 e apaga o que não é livro válido. A ordem
 * recebida é reorganizada em dois blocos: todos os `reading` primeiro (na ordem
 * dada), depois os demais. Livros válidos que não vieram entram no fim do bloco.
 */
function writeOrder<TRunResult>(
  db: AppDatabase<TRunResult>,
  bookIds: readonly string[],
): QueueItemRow[] {
  const valid = validBooks(db);
  const validById = new Map(valid.map((book) => [book.id, book] as const));
  const seen = new Set<string>();
  const provided = bookIds.filter((bookId) => {
    if (!validById.has(bookId) || seen.has(bookId)) {
      return false;
    }

    seen.add(bookId);
    return true;
  });
  const missing = valid.filter((book) => !seen.has(book.id));
  const combined = [...provided, ...missing.map((book) => book.id)];
  const finalIds = [
    ...combined.filter((bookId) => isReading(validById.get(bookId))),
    ...combined.filter((bookId) => !isReading(validById.get(bookId))),
  ];

  const existing = new Map(
    orderedRows(db).map((row) => [row.bookId, row] as const),
  );
  const wanted = new Set(finalIds);
  const now = new Date();

  for (const row of existing.values()) {
    if (!wanted.has(row.bookId)) {
      db.delete(queueItems).where(eq(queueItems.bookId, row.bookId)).run();
    }
  }

  finalIds.forEach((bookId, position) => {
    const current = existing.get(bookId);

    if (!current) {
      const book = validById.get(bookId);
      db.insert(queueItems)
        .values({
          bookId,
          position,
          note: null,
          createdAt: book?.createdAt ?? now,
          updatedAt: book?.updatedAt ?? now,
        })
        .run();
      return;
    }

    if (current.position !== position) {
      db.update(queueItems)
        .set({ position, updatedAt: now })
        .where(eq(queueItems.bookId, bookId))
        .run();
    }
  });

  return deriveRows(db);
}

export function createQueueRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): QueueRepository {
  function statusById<TRunResult>(
    database: AppDatabase<TRunResult>,
  ): Map<string, string> {
    return new Map(
      validBooks(database).map((book) => [book.id, book.status] as const),
    );
  }

  return {
    list() {
      return deriveRows(db);
    },

    sync() {
      return db.transaction((tx) =>
        writeOrder(
          tx,
          deriveRows(tx).map((row) => row.bookId),
        ),
      );
    },

    move(bookId, toPosition) {
      const parsedId = queueBookIdSchema.parse(bookId);
      const parsedPosition = positionSchema.parse(toPosition);

      return db.transaction((tx) => {
        const current = deriveRows(tx);
        const status = statusById(tx);
        const from = current.findIndex((row) => row.bookId === parsedId);

        if (from < 0) {
          return writeOrder(
            tx,
            current.map((row) => row.bookId),
          );
        }

        const readingCount = current.filter(
          (row) => status.get(row.bookId) === 'reading',
        ).length;
        const reading = status.get(parsedId) === 'reading';
        const min = reading ? 0 : readingCount;
        const max = reading ? readingCount - 1 : current.length - 1;
        const target = Math.min(Math.max(parsedPosition, min), max);
        const ids = current.map((row) => row.bookId);
        const next = [...ids];
        next.splice(from, 1);
        next.splice(target, 0, parsedId);

        return writeOrder(tx, next);
      });
    },

    replaceAll(bookIds) {
      const parsed = replaceAllSchema.parse(bookIds);

      return db.transaction((tx) => writeOrder(tx, parsed));
    },
  };
}
