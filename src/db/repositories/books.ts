import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { createId } from '@/lib/id';
import { isValidIsbn, toStoredIsbn } from '@/lib/isbn';

import { type BookRow, books, readingStatuses } from '../schema';
import type { AppDatabase } from '../types';

const isbnField = z
  .string()
  .nullable()
  .optional()
  .transform((value) => toStoredIsbn(value))
  .refine((value) => value === null || isValidIsbn(value), {
    message: 'ISBN inválido',
  });

const bookFields = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, 'Informe o título'),
  author: z.string().trim().min(1, 'Informe o autor'),
  genreId: z.string().trim().min(1, 'Escolha um gênero'),
  status: z.enum(readingStatuses),
  pages: z.number().int().positive(),
  pagesRead: z.number().int().nonnegative().default(0),
  isbn: isbnField,
  coverUri: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
});

export const bookInputSchema = bookFields.refine(
  (book) => book.pagesRead <= book.pages,
  {
    message: 'As páginas lidas não podem passar do total',
    path: ['pagesRead'],
  },
);

export type CreateBookInput = z.input<typeof bookInputSchema>;
export type BookPatch = Partial<Omit<CreateBookInput, 'id'>>;

export type BooksRepository = {
  list(): BookRow[];
  findById(id: string): BookRow | undefined;
  create(input: CreateBookInput): BookRow;
  update(id: string, patch: BookPatch): BookRow | undefined;
  remove(id: string): boolean;
};

const DUPLICATE_ISBN = 'Já existe um livro com este ISBN';

export function createBooksRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): BooksRepository {
  /** O índice único do banco também protege, mas aqui a mensagem fica clara. */
  function assertIsbnAvailable(isbn: string | null, exceptId?: string): void {
    if (!isbn) {
      return;
    }

    const existing = db.select().from(books).where(eq(books.isbn, isbn)).get();

    if (existing && existing.id !== exceptId) {
      throw new Error(DUPLICATE_ISBN);
    }
  }

  const repository: BooksRepository = {
    list() {
      return db.select().from(books).orderBy(books.createdAt, books.id).all();
    },

    findById(id) {
      return db.select().from(books).where(eq(books.id, id)).get();
    },

    create(input) {
      const parsed = bookInputSchema.parse(input);
      assertIsbnAvailable(parsed.isbn);
      const now = new Date();

      return db
        .insert(books)
        .values({
          ...parsed,
          id: parsed.id ?? createId('book'),
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
    },

    update(id, patch) {
      const current = repository.findById(id);
      if (!current) {
        return undefined;
      }

      // Valida o livro completo, não só os campos alterados.
      const merged = bookInputSchema.parse({
        title: current.title,
        author: current.author,
        genreId: current.genreId,
        status: current.status,
        pages: current.pages,
        pagesRead: current.pagesRead,
        isbn: current.isbn,
        coverUri: current.coverUri,
        ...patch,
      });

      assertIsbnAvailable(merged.isbn, id);

      return db
        .update(books)
        .set({
          title: merged.title,
          author: merged.author,
          genreId: merged.genreId,
          status: merged.status,
          pages: merged.pages,
          pagesRead: merged.pagesRead,
          isbn: merged.isbn,
          coverUri: merged.coverUri,
          updatedAt: new Date(),
        })
        .where(eq(books.id, id))
        .returning()
        .get();
    },

    remove(id) {
      const deleted = db
        .delete(books)
        .where(eq(books.id, id))
        .returning({ id: books.id })
        .all();

      return deleted.length > 0;
    },
  };

  return repository;
}
