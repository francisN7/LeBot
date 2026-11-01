import type { ReviewRow } from '@/db/schema';

/** Resenha como a UI usa: sem timestamps, com extras já normalizados. */
export type Review = {
  bookId: string;
  rating: number;
  text: string | null;
  quote: string | null;
  extras: Record<string, string>;
};

export function toReview(row: ReviewRow): Review {
  return {
    bookId: row.bookId,
    rating: row.rating,
    text: row.text,
    quote: row.quote,
    extras: { ...row.extras },
  };
}
