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

export type ReadingSessionsRepository = {
  listByBook(bookId: string): ReadingSessionRow[];
  /** Sessões com `readAt` entre `from` e `to`, inclusive. */
  listBetween(from: Date, to: Date): ReadingSessionRow[];
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
            // Chegar ao fim é a exceção automática (ADR 0007); a UI avisa.
            status: finished ? 'finished' : book.status,
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

        const appliedPages = Math.min(session.pages, book.pagesRead);
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
