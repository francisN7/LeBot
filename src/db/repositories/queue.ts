import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { books, type QueueItemRow, queueItems } from '../schema';
import type { AppDatabase } from '../types';

export const QUEUE_BOOK_NOT_FOUND = 'Livro não encontrado';
export const QUEUE_BOOK_FINISHED = 'Livro concluído não entra na ordem';

export const queueBookIdSchema = z.string().trim().min(1, 'Escolha um livro');

const replaceAllSchema = z.array(queueBookIdSchema);
const positionSchema = z.number().int();

/**
 * Ordem persistida: um livro por linha, posição compacta de 0..n-1.
 * Diferente da leitura, adicionar à ordem não muda o status do livro.
 */
export type QueueRepository = {
  /** Livros na ordem; ignora linhas órfãs ou de livro concluído. */
  list(): QueueItemRow[];
  /** Acrescenta no fim; repetir um livro já presente não o duplica. */
  add(bookId: string, note?: string | null): QueueItemRow;
  remove(bookId: string): boolean;
  /** Move para `toPosition` (0..n-1), reescrevendo a lista inteira. */
  move(bookId: string, toPosition: number): QueueItemRow[];
  /** Substitui a ordem inteira, numa transação. */
  replaceAll(bookIds: readonly string[]): QueueItemRow[];
};

function orderedRows<TRunResult>(db: AppDatabase<TRunResult>): QueueItemRow[] {
  return db
    .select()
    .from(queueItems)
    .orderBy(asc(queueItems.position), asc(queueItems.bookId))
    .all();
}

/** Ids válidos: livro existente e ainda não concluído. */
function validBookIds<TRunResult>(db: AppDatabase<TRunResult>): Set<string> {
  const rows = db
    .select({ id: books.id, status: books.status })
    .from(books)
    .all();

  return new Set(
    rows.filter((row) => row.status !== 'finished').map((row) => row.id),
  );
}

/** Lista visível: sem órfão e sem livro concluído (posição pode ter buraco). */
function visibleRows<TRunResult>(db: AppDatabase<TRunResult>): QueueItemRow[] {
  const valid = validBookIds(db);

  return orderedRows(db).filter((row) => valid.has(row.bookId));
}

/** Remove repetidos preservando a primeira ocorrência e descarta inválidos. */
function normalizeIds<TRunResult>(
  db: AppDatabase<TRunResult>,
  bookIds: readonly string[],
): string[] {
  const valid = validBookIds(db);
  const seen = new Set<string>();

  return bookIds.filter((bookId) => {
    if (!valid.has(bookId) || seen.has(bookId)) {
      return false;
    }

    seen.add(bookId);
    return true;
  });
}

/**
 * Reescreve `position` de 0..n-1 e apaga o que não está em `bookIds`.
 * Sempre dentro de transação: a ordem nunca fica com empate entre duas listas.
 */
function writeOrder<TRunResult>(
  db: AppDatabase<TRunResult>,
  bookIds: readonly string[],
): QueueItemRow[] {
  const desired = normalizeIds(db, bookIds);
  const existing = new Map(
    orderedRows(db).map((row) => [row.bookId, row] as const),
  );
  const wanted = new Set(desired);
  const now = new Date();

  for (const row of existing.values()) {
    if (!wanted.has(row.bookId)) {
      db.delete(queueItems).where(eq(queueItems.bookId, row.bookId)).run();
    }
  }

  desired.forEach((bookId, position) => {
    const current = existing.get(bookId);

    if (!current) {
      db.insert(queueItems)
        .values({
          bookId,
          position,
          note: null,
          createdAt: now,
          updatedAt: now,
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

  return orderedRows(db).filter((row) => wanted.has(row.bookId));
}

export function createQueueRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): QueueRepository {
  return {
    list() {
      return visibleRows(db);
    },

    add(bookId, note) {
      const parsedId = queueBookIdSchema.parse(bookId);
      const parsedNote =
        note === undefined || note === null ? null : note.trim();

      return db.transaction((tx) => {
        const book = tx
          .select({ id: books.id, status: books.status })
          .from(books)
          .where(eq(books.id, parsedId))
          .get();

        if (!book) {
          throw new Error(QUEUE_BOOK_NOT_FOUND);
        }

        if (book.status === 'finished') {
          throw new Error(QUEUE_BOOK_FINISHED);
        }

        const current = visibleRows(tx).map((row) => row.bookId);
        const rows = writeOrder(
          tx,
          current.includes(parsedId) ? current : [...current, parsedId],
        );

        if (parsedNote !== null) {
          tx.update(queueItems)
            .set({ note: parsedNote, updatedAt: new Date() })
            .where(eq(queueItems.bookId, parsedId))
            .run();
        }

        const row = rows.find((item) => item.bookId === parsedId);
        if (!row) {
          throw new Error(QUEUE_BOOK_NOT_FOUND);
        }

        return parsedNote === null ? row : { ...row, note: parsedNote };
      });
    },

    remove(bookId) {
      const parsedId = queueBookIdSchema.parse(bookId);

      return db.transaction((tx) => {
        const current = visibleRows(tx).map((row) => row.bookId);
        const next = current.filter((id) => id !== parsedId);
        writeOrder(tx, next);
        return next.length !== current.length;
      });
    },

    move(bookId, toPosition) {
      const parsedId = queueBookIdSchema.parse(bookId);
      const parsedPosition = positionSchema.parse(toPosition);

      return db.transaction((tx) => {
        const current = visibleRows(tx).map((row) => row.bookId);
        const from = current.indexOf(parsedId);

        if (from < 0) {
          return writeOrder(tx, current);
        }

        const target = Math.min(
          Math.max(parsedPosition, 0),
          current.length - 1,
        );
        const next = [...current];
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
