import type { ReadingStatus } from '@/db/schema';

export type { ReadingStatus };

/** Livro como a UI enxerga: sem timestamps nem detalhes de persistência. */
export type Book = {
  id: string;
  title: string;
  author: string;
  /** `genres.id`; o nome e a cor vêm do mapa de gêneros. */
  genreId: string;
  status: ReadingStatus;
  pages: number;
  pagesRead: number;
  /** ISBN normalizado, quando o dono preencheu. */
  isbn: string | null;
  /** Caminho local da capa em `documentDirectory/covers/`. */
  coverUri: string | null;
};
