import type { Book } from '@/features/library/types';
import type { Plan, PlanEntry } from '@/features/planner';
import type { ReadingSession } from '@/features/reading/types';

import { buildPlanView, readGoalPages } from './plan-view';

const today = new Date(2026, 9, 31, 9);

function makeBook(overrides: Partial<Book> & { id: string }): Book {
  return {
    title: `Livro ${overrides.id}`,
    author: 'Autora',
    genreId: 'fantasy',
    status: 'reading',
    pages: 300,
    pagesRead: 0,
    isbn: null,
    coverUri: null,
    updatedAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

const books = [
  makeBook({ id: 'ativo', title: 'O Hobbit', genreId: 'fantasy' }),
  makeBook({
    id: 'proximo',
    title: 'Orgulho e Preconceito',
    genreId: 'classic',
  }),
];

const activeEntry: PlanEntry = {
  bookId: 'ativo',
  pages: 11,
  source: 'active',
  finishes: false,
  suggestion: false,
};

const suggestionEntry: PlanEntry = {
  bookId: 'proximo',
  pages: 7,
  source: 'queue',
  finishes: false,
  suggestion: true,
};

const plan: Plan = {
  date: '2026-10-31',
  baseGoal: 18,
  goal: 18,
  pages: 18,
  entries: [activeEntry, suggestionEntry],
  lightDay: false,
  emptyReason: null,
};

function session(
  bookId: string,
  appliedPages: number,
  readAt: Date,
): ReadingSession {
  return {
    id: `reading-${bookId}-${readAt.getTime()}`,
    bookId,
    pages: appliedPages,
    appliedPages,
    readAt,
  };
}

describe('readGoalPages', () => {
  it('usa a meta da seed quando o valor não existe ou não é número', () => {
    expect(readGoalPages(undefined)).toBe(18);
    expect(readGoalPages('')).toBe(18);
    expect(readGoalPages('   ')).toBe(18);
    expect(readGoalPages('muito')).toBe(18);
  });

  it('devolve o número lido para o motor limitar a faixa 3–200', () => {
    expect(readGoalPages('24')).toBe(24);
    expect(readGoalPages('0')).toBe(0);
    expect(readGoalPages('500')).toBe(500);
  });
});

describe('buildPlanView', () => {
  it('marca o bloco principal como agora e a sugestão como depois', () => {
    const view = buildPlanView({ plan, books, sessions: [], today });

    expect(view.dateLabel).toBe('sábado, 31 de outubro');
    expect(view.pagesToday).toBe(0);
    expect(view.blocks.map((block) => block.status)).toEqual(['now', 'later']);
    expect(view.blocks[1]).toMatchObject({ suggestion: true });
    expect(view.message).toBe('Comece por O Hobbit.');
    expect(view.mascot).toBe('reading');
  });

  it('conta as páginas de hoje e passa o agora para a sugestão', () => {
    const view = buildPlanView({
      plan,
      books,
      sessions: [session('ativo', 11, today)],
      today,
    });

    expect(view.pagesToday).toBe(11);
    expect(view.blocks[0]).toMatchObject({ pagesToday: 11, status: 'done' });
    expect(view.blocks[1]).toMatchObject({ status: 'now' });
    expect(view.message).toBe('Comece por Orgulho e Preconceito.');
  });

  it('ignora sessões de outro dia', () => {
    const yesterday = new Date(2026, 9, 30, 22);

    const view = buildPlanView({
      plan,
      books,
      sessions: [session('ativo', 20, yesterday)],
      today,
    });

    expect(view.pagesToday).toBe(0);
    expect(view.blocks[0]).toMatchObject({ status: 'now' });
  });

  it('monta "Lido hoje" em ordem cronológica com hora local', () => {
    const early = new Date(2026, 9, 31, 8, 5);
    const late = new Date(2026, 9, 31, 21, 40);

    const view = buildPlanView({
      plan,
      books,
      sessions: [session('proximo', 7, late), session('ativo', 11, early)],
      today,
    });

    expect(view.sessionsToday).toEqual([
      {
        id: expect.any(String),
        bookId: 'ativo',
        bookTitle: 'O Hobbit',
        appliedPages: 11,
        timeLabel: '08:05',
      },
      {
        id: expect.any(String),
        bookId: 'proximo',
        bookTitle: 'Orgulho e Preconceito',
        appliedPages: 7,
        timeLabel: '21:40',
      },
    ]);
  });

  it('conta sessão órfã na meta, mas não lista sem livro', () => {
    const view = buildPlanView({
      plan,
      books,
      sessions: [session('livro-sumiu', 5, today)],
      today,
    });

    expect(view.pagesToday).toBe(5);
    expect(view.sessionsToday).toEqual([]);
  });

  it('considera feito o bloco de um livro que chegou ao fim', () => {
    const finished = books.map((book) =>
      book.id === 'proximo'
        ? { ...book, pagesRead: book.pages, status: 'finished' as const }
        : book,
    );

    const view = buildPlanView({
      plan,
      books: finished,
      sessions: [session('ativo', 11, today)],
      today,
    });

    expect(view.blocks.map((block) => block.status)).toEqual(['done', 'done']);
    expect(view.message).toBe('Meta do dia batida. O resto é bônus.');
    expect(view.mascot).toBe('celebrating');
  });

  it('mostra o vazio e o mascote sonolento sem livro elegível', () => {
    const emptyPlan: Plan = {
      ...plan,
      pages: 0,
      entries: [],
      emptyReason: 'no-books',
    };

    const view = buildPlanView({
      plan: emptyPlan,
      books,
      sessions: [],
      today,
    });

    expect(view.empty).toBe(true);
    expect(view.blocks).toEqual([]);
    expect(view.mascot).toBe('sleepy');
    expect(view.message).toContain('Nenhum livro com páginas restantes');
  });

  it('mantém o aviso de volta leve vindo do motor', () => {
    const lightPlan: Plan = {
      ...plan,
      goal: 12,
      pages: 12,
      lightDay: true,
      entries: [{ ...activeEntry, pages: 12 }],
    };

    const view = buildPlanView({
      plan: lightPlan,
      books,
      sessions: [],
      today,
    });

    expect(view.lightDay).toBe(true);
    expect(view.baseGoal).toBe(18);
    expect(view.goal).toBe(12);
    expect(view.message).toBe('Voltando com calma: hoje são 12 páginas.');
    expect(view.mascot).toBe('sleepy');
  });
});
