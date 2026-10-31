import type { BookGenre, ReadingStatus } from '@/db/schema';

export type { BookGenre, ReadingStatus };

/** Livro como a UI enxerga: sem timestamps nem detalhes de persistência. */
export type Book = {
  id: string;
  title: string;
  author: string;
  genre: BookGenre;
  status: ReadingStatus;
  pages: number;
  pagesRead: number;
};
