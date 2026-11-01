import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { books, type ReviewRow, reviews } from '../schema';
import type { AppDatabase } from '../types';

export const BOOK_NOT_FOUND = 'Livro não encontrado';
export const INVALID_RATING = 'Escolha de 1 a 5 estrelas';

const optionalText = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

/** Texto vazio ou só espaços não vira valor de campo extra. */
export function normalizeExtras(
  extras: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(extras)
      .map(([key, value]) => [key.trim(), value.trim()] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );
}

export const reviewInputSchema = z.object({
  bookId: z.string().trim().min(1, 'Escolha um livro'),
  rating: z
    .number()
    .int({ message: INVALID_RATING })
    .min(1, INVALID_RATING)
    .max(5, INVALID_RATING),
  text: optionalText,
  quote: optionalText,
  extras: z
    .record(z.string(), z.string())
    .default({})
    .transform((value) => normalizeExtras(value)),
});

export type SaveReviewInput = z.input<typeof reviewInputSchema>;

export type ReviewsRepository = {
  list(): ReviewRow[];
  findByBook(bookId: string): ReviewRow | undefined;
  /** Cria ou atualiza a resenha do livro; nunca duplica a linha. */
  save(input: SaveReviewInput): ReviewRow;
  remove(bookId: string): boolean;
  /** Remove a chave de um campo extra de todas as resenhas. */
  stripField(fieldId: string): number;
};

/**
 * Remove `fieldId` dos extras de todas as resenhas. O JSON não permite um
 * `UPDATE` parcial, então a lista é reescrita linha a linha (escala pessoal).
 */
export function stripFieldFromExtras<TRunResult>(
  db: AppDatabase<TRunResult>,
  fieldId: string,
): number {
  const rows = db.select().from(reviews).all();
  const now = new Date();
  let changed = 0;

  for (const row of rows) {
    if (!(fieldId in row.extras)) {
      continue;
    }

    const rest = Object.fromEntries(
      Object.entries(row.extras).filter(([key]) => key !== fieldId),
    );
    db.update(reviews)
      .set({ extras: rest, updatedAt: now })
      .where(eq(reviews.bookId, row.bookId))
      .run();
    changed += 1;
  }

  return changed;
}

export function createReviewsRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): ReviewsRepository {
  return {
    list() {
      return db.select().from(reviews).all();
    },

    findByBook(bookId) {
      return db.select().from(reviews).where(eq(reviews.bookId, bookId)).get();
    },

    save(input) {
      const parsed = reviewInputSchema.parse(input);
      const now = new Date();

      return db.transaction((tx) => {
        const book = tx
          .select({ id: books.id })
          .from(books)
          .where(eq(books.id, parsed.bookId))
          .get();

        if (!book) {
          throw new Error(BOOK_NOT_FOUND);
        }

        return tx
          .insert(reviews)
          .values({
            bookId: parsed.bookId,
            rating: parsed.rating,
            text: parsed.text,
            quote: parsed.quote,
            extras: parsed.extras,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: reviews.bookId,
            set: {
              rating: parsed.rating,
              text: parsed.text,
              quote: parsed.quote,
              extras: parsed.extras,
              updatedAt: now,
            },
          })
          .returning()
          .get();
      });
    },

    remove(bookId) {
      const deleted = db
        .delete(reviews)
        .where(eq(reviews.bookId, bookId))
        .returning({ bookId: reviews.bookId })
        .all();

      return deleted.length > 0;
    },

    stripField(fieldId) {
      return stripFieldFromExtras(db, fieldId);
    },
  };
}
