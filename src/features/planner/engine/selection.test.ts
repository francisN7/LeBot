import {
  isEligible,
  latestSession,
  orderByQueue,
  pickNextBook,
  remainingPages,
  selectActiveBook,
} from './selection';
import type { PlannerBook, PlannerSession } from './types';

function book(
  overrides: Partial<PlannerBook> & Pick<PlannerBook, 'id'>,
): PlannerBook {
  return {
    genreId: 'fantasy',
    status: 'reading',
    pages: 300,
    pagesRead: 0,
    ...overrides,
  };
}

function session(bookId: string, daysAgo = 0): PlannerSession {
  return { bookId, readAt: new Date(2026, 9, 31 - daysAgo, 12, 0) };
}

describe('remainingPages', () => {
  it('desconta o que já foi lido', () => {
    expect(remainingPages(book({ id: 'a', pages: 100, pagesRead: 40 }))).toBe(
      60,
    );
  });

  it('nunca fica negativo', () => {
    expect(remainingPages(book({ id: 'a', pages: 100, pagesRead: 120 }))).toBe(
      0,
    );
    expect(remainingPages(book({ id: 'a', pages: 100, pagesRead: -10 }))).toBe(
      100,
    );
  });
});

describe('isEligible', () => {
  it('aceita lendo e quero ler com páginas restantes', () => {
    expect(isEligible(book({ id: 'a' }))).toBe(true);
    expect(isEligible(book({ id: 'b', status: 'queued' }))).toBe(true);
  });

  it('recusa pausado, concluído e livro sem páginas', () => {
    expect(isEligible(book({ id: 'a', status: 'paused' }))).toBe(false);
    expect(isEligible(book({ id: 'a', status: 'finished' }))).toBe(false);
    expect(isEligible(book({ id: 'a', pages: 10, pagesRead: 10 }))).toBe(false);
    expect(isEligible(book({ id: 'a', pages: 0 }))).toBe(false);
  });
});

describe('latestSession', () => {
  it('escolhe a sessão mais recente de qualquer livro', () => {
    const sessions = [session('a', 4), session('b', 1), session('c', 2)];

    expect(latestSession(sessions)?.getTime()).toBe(
      session('b', 1).readAt.getTime(),
    );
  });

  it('ignora data inválida', () => {
    const sessions = [
      { bookId: 'a', readAt: new Date(Number.NaN) },
      session('b', 5),
    ];

    expect(latestSession(sessions)?.getTime()).toBe(
      session('b', 5).readAt.getTime(),
    );
  });

  it('devolve undefined sem sessões', () => {
    expect(latestSession([])).toBeUndefined();
  });
});

describe('orderByQueue', () => {
  const a = book({ id: 'a' });
  const b = book({ id: 'b' });
  const c = book({ id: 'c' });

  it('coloca os ids da fila primeiro, na ordem da fila', () => {
    expect(orderByQueue([a, b, c], ['c', 'a']).map((item) => item.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('mantém a ordem recebida para quem não está na fila', () => {
    expect(orderByQueue([c, a, b], ['a']).map((item) => item.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('ignora id inexistente e id repetido', () => {
    expect(
      orderByQueue([a, b], ['ghost', 'b', 'b', 'a']).map((item) => item.id),
    ).toEqual(['b', 'a']);
  });

  it('sem fila, devolve a ordem recebida', () => {
    expect(orderByQueue([c, a, b]).map((item) => item.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});

describe('selectActiveBook', () => {
  it('escolhe o primeiro lendo da ordem recebida', () => {
    const a = book({ id: 'a' });
    const b = book({ id: 'b', genreId: 'romance' });

    expect(selectActiveBook([a, b])?.id).toBe('a');
    expect(selectActiveBook([b, a])?.id).toBe('b');
  });

  it('ignora quero ler, pausado e concluído', () => {
    const books = [
      book({ id: 'a', status: 'queued' }),
      book({ id: 'b', status: 'paused' }),
      book({ id: 'c', status: 'finished' }),
    ];

    expect(selectActiveBook(books)).toBeUndefined();
  });

  it('pula lendo sem páginas restantes', () => {
    const books = [
      book({ id: 'a', pages: 100, pagesRead: 100 }),
      book({ id: 'b' }),
    ];

    expect(selectActiveBook(books)?.id).toBe('b');
  });

  it('devolve undefined sem livro lendo', () => {
    expect(selectActiveBook([])).toBeUndefined();
    expect(
      selectActiveBook([book({ id: 'a', status: 'queued' })]),
    ).toBeUndefined();
  });
});

describe('pickNextBook', () => {
  const fantasy = book({ id: 'fantasy', genreId: 'fantasy' });
  const fantasyTwo = book({ id: 'fantasy-2', genreId: 'fantasy' });
  const romance = book({ id: 'romance', genreId: 'romance' });

  it('pula o mesmo gênero quando há outro depois', () => {
    expect(pickNextBook([fantasyTwo, romance], 'fantasy')?.id).toBe('romance');
  });

  it('repete o gênero quando não há opção', () => {
    expect(pickNextBook([fantasyTwo], 'fantasy')?.id).toBe('fantasy-2');
  });

  it('sem gênero anterior, pega o primeiro', () => {
    expect(pickNextBook([fantasy, romance], undefined)?.id).toBe('fantasy');
  });

  it('devolve undefined sem candidatos', () => {
    expect(pickNextBook([], 'fantasy')).toBeUndefined();
  });
});
