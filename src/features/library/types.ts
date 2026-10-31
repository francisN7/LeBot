/** Gêneros usados para colorir a lombada (ver `docs/brand.md`). */
export type BookGenre =
  | 'fantasy'
  | 'romance'
  | 'nonfiction'
  | 'classic'
  | 'children'
  | 'horror';

export type ReadingStatus = 'reading' | 'queued' | 'paused' | 'finished';

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: BookGenre;
  status: ReadingStatus;
  pages: number;
  pagesRead: number;
};
