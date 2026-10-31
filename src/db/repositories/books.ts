import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { createId } from '@/lib/id';

import { type BookRow, bookGenres, books, readingStatuses } from '../schema';
import type { AppDatabase } from '../types';

const bookFields = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, 'Informe o título'),
  author: z.string().trim().min(1, 'Informe o autor'),
  genre: z.enum(bookGenres),
  status: z.enum(readingStatuses),
  pages: z.number().int().positive(),
  pagesRead: z.number().int().nonnegative().default(0),
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

export function createBooksRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): BooksRepository {
  const repository: BooksRepository = {
    list() {
      return db.select().from(books).orderBy(books.createdAt, books.id).all();
    },

    findById(id) {
      return db.select().from(books).where(eq(books.id, id)).get();
    },

    create(input) {
      const parsed = bookInputSchema.parse(input);
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
        genre: current.genre,
        status: current.status,
        pages: current.pages,
        pagesRead: current.pagesRead,
        ...patch,
      });

      return db
        .update(books)
        .set({
          title: merged.title,
          author: merged.author,
          genre: merged.genre,
          status: merged.status,
          pages: merged.pages,
          pagesRead: merged.pagesRead,
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
