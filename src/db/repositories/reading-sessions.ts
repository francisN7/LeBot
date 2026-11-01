import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

import { createId } from '@/lib/id';

import {
  type BookRow,
  books,
  type ReadingSessionRow,
  readingSessions,
} from '../schema';
import type { AppDatabase } from '../types';

export const BOOK_NOT_FOUND = 'Livro não encontrado';
export const BOOK_ALREADY_FINISHED = 'Este livro já está no fim';

export const readingSessionInputSchema = z.object({
  bookId: z.string().trim().min(1, 'Escolha um livro'),
  pages: z.number().int().positive('Informe pelo menos 1 página'),
  readAt: z.date().optional(),
});

export type CreateReadingSessionInput = z.input<
  typeof readingSessionInputSchema
>;

/** Efeito de gravar uma sessão: a sessão e o livro já com o novo progresso. */
export type ReadingSessionWrite = {
  session: ReadingSessionRow;
  book: BookRow;
  /** Páginas somadas de fato; menor que `session.pages` quando o livro acaba. */
  appliedPages: number;
};

/** Efeito de desfazer uma sessão; `book` falta quando o livro já foi excluído. */
export type ReadingSessionRemoval = {
  session: ReadingSessionRow;
  book: BookRow | undefined;
  /** Páginas subtraídas de fato; 0 quando o progresso já estava zerado. */
  appliedPages: number;
};

/** Páginas da sessão que entraram de fato no progresso. */
export function appliedPagesOf(row: ReadingSessionRow): number {
  // Linhas gravadas antes da S5.1 não têm a coluna; nelas vale `pages`.
  return row.appliedPages ?? row.pages;
}

export type ReadingSessionsRepository = {
  listByBook(bookId: string): ReadingSessionRow[];
  /** Sessões com `readAt` entre `from` e `to`, inclusive. */
  listBetween(from: Date, to: Date): ReadingSessionRow[];
  /** Sessão mais recente de qualquer livro; `undefined` quando não há nenhuma. */
  latest(): ReadingSessionRow | undefined;
  /**
   * Última sessão de cada livro, uma linha por livro. A sessão que chega ao
   * fim é sempre a última do livro, então ela data a conclusão (S10).
   */
  listLatestPerBook(): ReadingSessionRow[];
  create(input: CreateReadingSessionInput): ReadingSessionWrite;
  remove(id: string): ReadingSessionRemoval | undefined;
};

export function createReadingSessionsRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): ReadingSessionsRepository {
  const repository: ReadingSessionsRepository = {
    listByBook(bookId) {
      return db
        .select()
        .from(readingSessions)
        .where(eq(readingSessions.bookId, bookId))
        .orderBy(desc(readingSessions.readAt), desc(readingSessions.id))
        .all();
    },

    listBetween(from, to) {
      return db
        .select()
        .from(readingSessions)
        .where(
          and(
            gte(readingSessions.readAt, from),
            lte(readingSessions.readAt, to),
          ),
        )
        .orderBy(asc(readingSessions.readAt), asc(readingSessions.id))
        .all();
    },

    latest() {
      return db
        .select()
        .from(readingSessions)
        .orderBy(desc(readingSessions.readAt), desc(readingSessions.id))
        .limit(1)
        .get();
    },

    listLatestPerBook() {
      const seen = new Set<string>();
      const latestRows: ReadingSessionRow[] = [];

      for (const row of db
        .select()
        .from(readingSessions)
        .orderBy(desc(readingSessions.readAt), desc(readingSessions.id))
        .all()) {
        if (!seen.has(row.bookId)) {
          seen.add(row.bookId);
          latestRows.push(row);
        }
      }

      return latestRows;
    },

    create(input) {
      const parsed = readingSessionInputSchema.parse(input);

      // A sessão e o progresso do livro andam juntos ou não andam.
      return db.transaction((tx) => {
        const book = tx
          .select()
          .from(books)
          .where(eq(books.id, parsed.bookId))
          .get();

        if (!book) {
          throw new Error(BOOK_NOT_FOUND);
        }

        const remaining = book.pages - book.pagesRead;

        if (remaining <= 0) {
          throw new Error(BOOK_ALREADY_FINISHED);
        }

        const now = new Date();
        const appliedPages = Math.min(parsed.pages, remaining);
        const pagesRead = book.pagesRead + appliedPages;
        const finished = pagesRead >= book.pages;

        const session = tx
          .insert(readingSessions)
          .values({
            id: createId('reading'),
            bookId: parsed.bookId,
            pages: parsed.pages,
            appliedPages,
            readAt: parsed.readAt ?? now,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();

        const updatedBook = tx
          .update(books)
          .set({
            pagesRead,
            // Quem registra leitura está lendo: sai de `queued`/`paused`
            // (ADR 0015). Chegar ao fim conclui o livro (ADR 0007).
            status: finished ? 'finished' : 'reading',
            updatedAt: now,
          })
          .where(eq(books.id, book.id))
          .returning()
          .get();

        return { session, book: updatedBook, appliedPages };
      });
    },

    remove(id) {
      return db.transaction((tx) => {
        const session = tx
          .select()
          .from(readingSessions)
          .where(eq(readingSessions.id, id))
          .get();

        if (!session) {
          return undefined;
        }

        tx.delete(readingSessions).where(eq(readingSessions.id, id)).run();

        const book = tx
          .select()
          .from(books)
          .where(eq(books.id, session.bookId))
          .get();

        if (!book) {
          return { session, book: undefined, appliedPages: 0 };
        }

        const appliedPages = Math.min(appliedPagesOf(session), book.pagesRead);
        const pagesRead = book.pagesRead - appliedPages;
        const updatedBook = tx
          .update(books)
          .set({
            pagesRead,
            // Desfazer a leitura que concluiu o livro volta para "lendo".
            status:
              book.status === 'finished' && pagesRead < book.pages
                ? 'reading'
                : book.status,
            updatedAt: new Date(),
          })
          .where(eq(books.id, book.id))
          .returning()
          .get();

        return { session, book: updatedBook, appliedPages };
      });
    },
  };

  return repository;
}
