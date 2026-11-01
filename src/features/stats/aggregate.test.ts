import type { Book } from '@/features/library/types';

import {
  type AggregateInput,
  aggregateStats,
  currentStreak,
  type StatsSession,
} from './aggregate';

const today = new Date(2026, 10, 1, 12); // 1º de novembro de 2026

function at(month: number, day: number): Date {
  return new Date(2026, month, day, 10);
}

function book(overrides: Partial<Book> & { id: string }): Book {
  return {
    title: 'Livro',
    author: 'Autora',
    genreId: 'fantasy',
    status: 'reading',
    pages: 200,
    pagesRead: 0,
    isbn: null,
    coverUri: null,
    updatedAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

function session(
  bookId: string,
  readAt: Date,
  pages = 10,
  appliedPages: number | null = null,
): StatsSession {
  return { bookId, readAt, pages, appliedPages };
}

function base(overrides: Partial<AggregateInput> = {}): AggregateInput {
  return {
    period: '1m',
    today,
    sessions: [],
    previousSessions: [],
    latestPerBook: [],
    books: [],
    genres: [],
    reviews: [],
    ...overrides,
  };
}

describe('currentStreak', () => {
  it('conta dias seguidos até hoje', () => {
    expect(
      currentStreak(
        [{ readAt: at(9, 30) }, { readAt: at(9, 31) }, { readAt: at(10, 1) }],
        today,
      ),
    ).toBe(3);
  });

  it('dá folga para o dia de hoje ainda não lido', () => {
    expect(
      currentStreak([{ readAt: at(9, 30) }, { readAt: at(9, 31) }], today),
    ).toBe(2);
  });

  it('para na primeira folga', () => {
    expect(
      currentStreak([{ readAt: at(10, 1) }, { readAt: at(9, 30) }], today),
    ).toBe(1);
  });

  it('zera quando não há leitura hoje nem ontem', () => {
    expect(currentStreak([{ readAt: at(9, 20) }], today)).toBe(0);
  });
});

describe('aggregateStats', () => {
  it('soma páginas, dias ativos e média do período', () => {
    const stats = aggregateStats(
      base({
        sessions: [
          session('book-1', at(9, 30), 20),
          session('book-1', at(9, 31), 10),
          session('book-1', at(10, 1), 5),
        ],
      }),
    );

    expect(stats.pages).toBe(35);
    expect(stats.activeDays).toBe(3);
    expect(stats.averagePerActiveDay).toBe(12);
    expect(stats.streak).toBe(3);
    expect(stats.buckets.at(-1)?.pages).toBe(35);
    expect(stats.insight.text).toBe(
      'Sequência de 3 dias. O LêBot está orgulhoso.',
    );
    expect(stats.insight.mood).toBe('celebrating');
  });

  it('usa appliedPages no lugar de pages quando a sessão passou do fim', () => {
    const stats = aggregateStats(
      base({ sessions: [session('book-1', at(10, 1), 30, 8)] }),
    );

    expect(stats.pages).toBe(8);
  });

  it('conta sessão órfã nas páginas, mas não no gênero', () => {
    const stats = aggregateStats(
      base({
        books: [book({ id: 'book-1', genreId: 'fantasy' })],
        genres: [{ id: 'fantasy', name: 'Fantasia', colorLight: '#7B69EE' }],
        sessions: [
          session('book-1', at(10, 1), 30),
          session('book-apagado', at(10, 1), 20),
        ],
      }),
    );

    expect(stats.pages).toBe(50);
    expect(stats.genres).toHaveLength(1);
    expect(stats.genres[0]).toMatchObject({
      name: 'Fantasia',
      pages: 30,
      finished: 0,
    });
  });

  it('data a conclusão pela última sessão e cai no updatedAt sem sessão', () => {
    const stats = aggregateStats(
      base({
        books: [
          book({ id: 'book-a', status: 'finished' }),
          book({ id: 'book-b', status: 'finished', updatedAt: at(10, 1) }),
          book({ id: 'book-c', status: 'finished', updatedAt: at(9, 1) }),
        ],
        latestPerBook: [
          // A data mais recente vence por livro.
          session('book-a', at(9, 20)),
          // Concluído antes do período: updatedAt recente não deve contar.
          session('book-c', at(8, 1)),
        ],
        genres: [{ id: 'fantasy', name: 'Fantasia', colorLight: '#7B69EE' }],
      }),
    );

    expect(stats.finished.map((item) => item.bookId)).toEqual([
      'book-b',
      'book-a',
    ]);
    expect(stats.finished[0]).toMatchObject({ exact: false });
    expect(stats.finished[1]).toMatchObject({ exact: true });
    expect(stats.genres[0]).toMatchObject({ finished: 2 });
  });

  it('calcula nota média e distribuição só de livros existentes', () => {
    const stats = aggregateStats(
      base({
        books: [book({ id: 'book-a' }), book({ id: 'book-b' })],
        reviews: [
          { bookId: 'book-a', rating: 5 },
          { bookId: 'book-b', rating: 3 },
          { bookId: 'book-apagado', rating: 1 },
        ],
      }),
    );

    expect(stats.ratings.average).toBe(4);
    expect(stats.ratings.count).toBe(2);
    expect(stats.ratings.distribution).toEqual([
      { rating: 5, count: 1 },
      { rating: 4, count: 0 },
      { rating: 3, count: 1 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ]);
    expect(stats.ratings.books).toEqual([
      { bookId: 'book-a', title: 'Livro', author: 'Autora', rating: 5 },
      { bookId: 'book-b', title: 'Livro', author: 'Autora', rating: 3 },
    ]);
  });

  it('compara com a janela anterior, sem gênero para puxar a frase', () => {
    const stats = aggregateStats(
      base({
        sessions: [session('book-apagado', at(10, 1), 10)],
        previousSessions: [session('book-apagado', at(8, 20), 5)],
      }),
    );

    expect(stats.previousPages).toBe(5);
    expect(stats.insight.text).toBe(
      '100% mais páginas que no período anterior.',
    );
  });

  it('agrupa o sexto gênero em Outros', () => {
    const stats = aggregateStats(
      base({
        books: [1, 2, 3, 4, 5, 6].map((index) =>
          book({ id: `book-${index}`, genreId: `genre-${index}` }),
        ),
        genres: [1, 2, 3, 4, 5, 6].map((index) => ({
          id: `genre-${index}`,
          name: `Gênero ${index}`,
          colorLight: '#7B69EE',
        })),
        sessions: [1, 2, 3, 4, 5, 6].map((index) =>
          session(`book-${index}`, at(10, 1), 10),
        ),
      }),
    );

    expect(stats.genres).toHaveLength(6);
    expect(stats.genres.at(-1)).toMatchObject({
      id: 'other',
      name: 'Outros',
      pages: 10,
    });
  });

  it('estado vazio não inventa números', () => {
    const stats = aggregateStats(base());

    expect(stats.hasData).toBe(false);
    expect(stats.pages).toBe(0);
    expect(stats.insight.mood).toBe('thinking');
    expect(stats.insight.text).toContain('Ainda não tem páginas');
  });

  it('muda o recorte ao trocar o período', () => {
    const sessions = [
      session('book-apagado', at(8, 20), 40), // fora das últimas 4 semanas
      session('book-apagado', at(10, 1), 10),
    ];

    expect(aggregateStats(base({ sessions })).pages).toBe(10);
    expect(aggregateStats(base({ period: '3m', sessions })).pages).toBe(50);
  });
});
