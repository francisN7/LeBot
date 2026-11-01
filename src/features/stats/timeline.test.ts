import type { Book } from '@/features/library/types';

import type { StatsSession } from './aggregate';
import { buildTimeline } from './timeline';

const today = new Date(2026, 10, 1, 12); // 1º de novembro de 2026

function session(
  bookId: string,
  readAt: Date,
  pages = 10,
  appliedPages: number | null = null,
): StatsSession {
  return { bookId, readAt, pages, appliedPages };
}

function book(
  overrides: Partial<Book> & { id: string; status: Book['status'] },
): Pick<Book, 'id' | 'status' | 'updatedAt'> {
  return {
    id: overrides.id,
    status: overrides.status,
    updatedAt: overrides.updatedAt ?? new Date(2026, 0, 1),
  };
}

describe('buildTimeline', () => {
  it('soma todo o histórico e separa por ano', () => {
    const timeline = buildTimeline({
      today,
      sessions: [
        session('book-1', new Date(2025, 9, 20), 30),
        session('book-1', new Date(2026, 0, 10), 40),
        session('book-apagado', new Date(2026, 4, 5), 5),
        session('book-1', new Date(2026, 10, 1), 10, 8),
      ],
      books: [
        book({ id: 'book-1', status: 'finished' }),
        book({
          id: 'book-2',
          status: 'finished',
          updatedAt: new Date(2025, 1, 1),
        }),
      ],
      latestPerBook: [
        session('book-1', new Date(2026, 9, 1)),
        session('book-2', new Date(2025, 0, 20)),
      ],
    });

    expect(timeline.from).toEqual(new Date(2025, 9, 20));
    expect(timeline.pages).toBe(83);
    expect(timeline.activeDays).toBe(4);
    expect(timeline.finished).toBe(2);
    expect(timeline.monthsWithReading).toBe(4);
    expect(timeline.years.map((year) => year.year)).toEqual([2026, 2025]);

    const [current, previous] = timeline.years;

    expect(current).toMatchObject({ pages: 53, activeDays: 3, finished: 1 });
    expect(current?.months[0]).toMatchObject({ label: 'jan', pages: 40 });
    expect(current?.months[4]).toMatchObject({ label: 'mai', pages: 5 });
    expect(current?.months[10]).toMatchObject({
      label: 'nov',
      pages: 8,
      current: true,
    });
    expect(current?.months[11]).toMatchObject({ label: 'dez', pages: 0 });

    expect(previous).toMatchObject({ pages: 30, activeDays: 1, finished: 1 });
    expect(previous?.months[9]).toMatchObject({ label: 'out', pages: 30 });
  });

  it('não inventa histórico vazio', () => {
    const timeline = buildTimeline({
      today,
      sessions: [],
      books: [],
      latestPerBook: [],
    });

    expect(timeline.from).toBeNull();
    expect(timeline.pages).toBe(0);
    expect(timeline.years).toEqual([]);
  });

  it('usa a última sessão (ou updatedAt) para contar concluídos por ano', () => {
    const timeline = buildTimeline({
      today,
      sessions: [session('book-1', new Date(2025, 5, 1), 10)],
      books: [book({ id: 'book-2', status: 'finished' })],
      latestPerBook: [session('book-2', new Date(2025, 7, 1))],
    });

    expect(timeline.years.map((year) => year.year)).toEqual([2026, 2025]);
    expect(timeline.years[1]).toMatchObject({ finished: 1, pages: 10 });
  });
});
