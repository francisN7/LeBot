import type { ReadingSessionRow } from '@/db/schema';

/** Sessão de leitura como a UI enxerga: sem timestamps de persistência. */
export type ReadingSession = {
  id: string;
  bookId: string;
  pages: number;
  /** Dia da leitura. */
  readAt: Date;
};

export function toReadingSession(row: ReadingSessionRow): ReadingSession {
  return {
    id: row.id,
    bookId: row.bookId,
    pages: row.pages,
    readAt: row.readAt,
  };
}

/** Dia/mês, sem depender do locale do aparelho nos testes. */
export function formatReadDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/** Percentual inteiro de páginas lidas, sempre entre 0 e 100. */
export function readingPercent(pagesRead: number, pages: number): number {
  if (pages <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((pagesRead / pages) * 100)));
}
