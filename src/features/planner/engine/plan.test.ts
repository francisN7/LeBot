import { buildPlan } from './plan';
import type {
  Plan,
  PlanEntry,
  PlannerBook,
  PlannerInput,
  PlannerSession,
} from './types';

const today = new Date(2026, 9, 31, 12, 0);

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

function plan(
  input: Partial<PlannerInput> & Pick<PlannerInput, 'books'>,
): Plan {
  return buildPlan({
    today,
    goalPages: 18,
    sessions: [],
    ...input,
  });
}

function pagesByBook(result: Plan): Record<string, number> {
  return Object.fromEntries(
    result.entries.map((entry) => [entry.bookId, entry.pages]),
  );
}

function entryOf(result: Plan, bookId: string): PlanEntry | undefined {
  return result.entries.find((entry) => entry.bookId === bookId);
}

describe('buildPlan — dia normal', () => {
  it('começa pelo livro ativo e completa com a fila', () => {
    const duna = book({ id: 'duna' });
    const cem = book({ id: 'cem', genreId: 'romance', status: 'queued' });
    const result = plan({
      books: [cem, duna],
      sessions: [session('duna')],
      queueBookIds: ['duna', 'cem'],
    });

    expect(result).toMatchObject({
      date: '2026-10-31',
      baseGoal: 18,
      goal: 18,
      pages: 18,
      lightDay: false,
      emptyReason: null,
    });
    expect(result.entries.map((entry) => entry.bookId)).toEqual([
      'duna',
      'cem',
    ]);
    expect(entryOf(result, 'duna')).toMatchObject({
      pages: 11,
      source: 'active',
      finishes: false,
      suggestion: false,
    });
    expect(entryOf(result, 'cem')).toMatchObject({
      pages: 7,
      source: 'queue',
      finishes: false,
      suggestion: true,
    });
  });

  it('livro ativo perto do fim cede a sobra para o próximo', () => {
    const duna = book({ id: 'duna', pages: 100, pagesRead: 97 });
    const cem = book({ id: 'cem', genreId: 'romance', status: 'queued' });
    const result = plan({ books: [duna, cem], sessions: [session('duna')] });

    expect(pagesByBook(result)).toEqual({ duna: 3, cem: 15 });
    expect(entryOf(result, 'duna')?.finishes).toBe(true);
    expect(entryOf(result, 'cem')?.finishes).toBe(false);
    expect(result.pages).toBe(18);
  });

  it('com um livro só, o teto flexível deixa o dia inteiro', () => {
    const result = plan({
      books: [book({ id: 'duna' })],
      sessions: [session('duna')],
    });

    expect(result.entries).toEqual([
      {
        bookId: 'duna',
        pages: 18,
        source: 'active',
        finishes: false,
        suggestion: false,
      },
    ]);
  });

  it('livro que acaba antes da meta deixa o plano parcial', () => {
    const result = plan({
      books: [book({ id: 'duna', pages: 10, pagesRead: 5 })],
      sessions: [session('duna')],
    });

    expect(result.pages).toBe(5);
    expect(entryOf(result, 'duna')).toMatchObject({
      pages: 5,
      finishes: true,
    });
    expect(result.emptyReason).toBeNull();
  });

  it('sem livro ativo, a fila é o próprio plano', () => {
    const cem = book({ id: 'cem', genreId: 'romance', status: 'queued' });
    const result = plan({ books: [cem] });

    expect(result.entries).toEqual([
      {
        bookId: 'cem',
        pages: 18,
        source: 'queue',
        finishes: false,
        suggestion: false,
      },
    ]);
  });

  it('sem livro ativo, dois livros pequenos completam a meta', () => {
    const primeiro = book({ id: 'a', status: 'queued', pages: 5 });
    const segundo = book({
      id: 'b',
      genreId: 'romance',
      status: 'queued',
    });
    const result = plan({
      books: [primeiro, segundo],
      queueBookIds: ['a', 'b'],
    });

    expect(pagesByBook(result)).toEqual({ a: 5, b: 13 });
    expect(result.entries.every((entry) => entry.suggestion === false)).toBe(
      true,
    );
  });

  it('o ativo vence a ordem da fila', () => {
    const cem = book({ id: 'cem', genreId: 'romance', status: 'queued' });
    const duna = book({ id: 'duna' });
    const result = plan({
      books: [cem, duna],
      sessions: [session('duna')],
      queueBookIds: ['cem', 'duna'],
    });

    expect(result.entries.map((entry) => entry.bookId)).toEqual([
      'duna',
      'cem',
    ]);
  });

  it('alterna o gênero pulando o livro repetido', () => {
    const ativo = book({ id: 'ativo', genreId: 'fantasy' });
    const repetido = book({
      id: 'repetido',
      genreId: 'fantasy',
      status: 'queued',
    });
    const outro = book({ id: 'outro', genreId: 'romance', status: 'queued' });
    const result = plan({
      books: [ativo, repetido, outro],
      sessions: [session('ativo')],
      queueBookIds: ['ativo', 'repetido', 'outro'],
    });

    expect(result.entries.map((entry) => entry.bookId)).toEqual([
      'ativo',
      'outro',
    ]);
  });

  it('repete o gênero quando não há outra opção', () => {
    const ativo = book({ id: 'ativo', genreId: 'fantasy' });
    const repetido = book({
      id: 'repetido',
      genreId: 'fantasy',
      status: 'queued',
    });
    const result = plan({
      books: [ativo, repetido],
      sessions: [session('ativo')],
    });

    expect(result.entries.map((entry) => entry.bookId)).toEqual([
      'ativo',
      'repetido',
    ]);
  });

  it('a sobra prefere o ativo quando o segundo livro acaba', () => {
    const ativo = book({ id: 'ativo' });
    const curto = book({
      id: 'curto',
      genreId: 'romance',
      status: 'queued',
      pages: 3,
    });
    const result = plan({
      books: [ativo, curto],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({ ativo: 15, curto: 3 });
    expect(entryOf(result, 'curto')?.finishes).toBe(true);
  });

  it('usa um terceiro livro quando os dois primeiros acabam', () => {
    const ativo = book({ id: 'ativo', pages: 3 });
    const segundo = book({
      id: 'segundo',
      genreId: 'romance',
      status: 'queued',
      pages: 5,
    });
    const terceiro = book({
      id: 'terceiro',
      genreId: 'scifi',
      status: 'queued',
      pages: 10,
    });
    const result = plan({
      books: [ativo, segundo, terceiro],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({
      ativo: 3,
      segundo: 5,
      terceiro: 10,
    });
    expect(result.pages).toBe(18);
  });
});

describe('buildPlan — volta leve', () => {
  const ativo = book({ id: 'ativo' });
  const proximo = book({ id: 'proximo', genreId: 'romance', status: 'queued' });

  it('três dias sem sessão reduzem a meta a 70%', () => {
    const result = plan({
      books: [ativo, proximo],
      sessions: [session('ativo', 3)],
    });

    expect(result.lightDay).toBe(true);
    expect(result.baseGoal).toBe(18);
    expect(result.goal).toBe(12);
    expect(pagesByBook(result)).toEqual({ ativo: 7, proximo: 5 });
  });

  it('dois dias sem sessão ainda é dia normal', () => {
    const result = plan({
      books: [ativo, proximo],
      sessions: [session('ativo', 2)],
    });

    expect(result.lightDay).toBe(false);
    expect(result.goal).toBe(18);
  });

  it('sem sessão nenhuma não é volta leve', () => {
    const result = plan({ books: [proximo] });

    expect(result.lightDay).toBe(false);
    expect(result.goal).toBe(18);
  });

  it('conta sessão de qualquer livro, mesmo fora da entrada', () => {
    const result = plan({
      books: [proximo],
      sessions: [session('livro-apagado', 3)],
    });

    expect(result.lightDay).toBe(true);
    expect(result.goal).toBe(12);
    expect(result.pages).toBe(12);
  });

  it('meta 3 na volta leve desce para 2', () => {
    const result = plan({
      books: [proximo],
      goalPages: 3,
      sessions: [session('proximo', 3)],
    });

    expect(result.lightDay).toBe(true);
    expect(result.goal).toBe(2);
    expect(result.pages).toBe(2);
  });
});

describe('buildPlan — meta e arredondamento', () => {
  const ativo = book({ id: 'ativo' });
  const proximo = book({ id: 'proximo', genreId: 'romance', status: 'queued' });

  it('meta 10 divide em 6 + 4', () => {
    const result = plan({
      goalPages: 10,
      books: [ativo, proximo],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({ ativo: 6, proximo: 4 });
  });

  it('meta 9 não divide: um livro leva o dia', () => {
    const result = plan({
      goalPages: 9,
      books: [ativo, proximo],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({ ativo: 9 });
  });

  it('meta 9 com ativo curto completa no segundo livro', () => {
    const curto = book({ id: 'ativo', pages: 10, pagesRead: 6 });
    const result = plan({
      goalPages: 9,
      books: [curto, proximo],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({ ativo: 4, proximo: 5 });
    expect(entryOf(result, 'proximo')?.suggestion).toBe(true);
  });

  it('meta 21 arredonda o teto de 60% para 12', () => {
    const result = plan({
      goalPages: 21,
      books: [ativo, proximo],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({ ativo: 12, proximo: 9 });
  });

  it('meta 28 arredonda o teto de 60% para 17', () => {
    const result = plan({
      goalPages: 28,
      books: [ativo, proximo],
      sessions: [session('ativo')],
    });

    expect(pagesByBook(result)).toEqual({ ativo: 17, proximo: 11 });
  });

  it('meta 0, negativa e NaN caem em 3', () => {
    for (const goal of [0, -10, Number.NaN]) {
      const result = plan({
        goalPages: goal,
        books: [proximo],
      });

      expect(result.baseGoal).toBe(3);
      expect(result.goal).toBe(3);
      expect(result.pages).toBe(3);
    }
  });

  it('meta acima de 200 é limitada', () => {
    const result = plan({
      goalPages: 500,
      books: [ativo],
      sessions: [session('ativo')],
    });

    expect(result.baseGoal).toBe(200);
    expect(result.goal).toBe(200);
    expect(result.pages).toBe(200);
  });

  it('meta 10 com um livro só chega a 10', () => {
    const result = plan({
      goalPages: 10,
      books: [ativo],
      sessions: [session('ativo')],
    });

    expect(result.pages).toBe(10);
  });

  it('meta 3 com um livro só cabe inteira', () => {
    const result = plan({
      goalPages: 3,
      books: [ativo],
      sessions: [session('ativo')],
    });

    expect(result.pages).toBe(3);
  });
});

describe('buildPlan — elegibilidade', () => {
  it('sem livros devolve plano vazio com motivo', () => {
    const result = plan({ books: [] });

    expect(result.entries).toEqual([]);
    expect(result.pages).toBe(0);
    expect(result.emptyReason).toBe('no-books');
    expect(result.goal).toBe(18);
  });

  it('todos concluídos, pausados ou sem páginas devolvem no-books', () => {
    const result = plan({
      books: [
        book({ id: 'a', status: 'finished', pagesRead: 300 }),
        book({ id: 'b', status: 'paused' }),
        book({ id: 'c', status: 'queued', pages: 0 }),
      ],
    });

    expect(result.emptyReason).toBe('no-books');
    expect(result.entries).toEqual([]);
  });

  it('pausado nunca entra no plano', () => {
    const ativo = book({ id: 'ativo' });
    const pausado = book({ id: 'pausado', status: 'paused' });
    const proximo = book({
      id: 'proximo',
      genreId: 'romance',
      status: 'queued',
    });
    const result = plan({
      books: [ativo, pausado, proximo],
      sessions: [session('ativo')],
    });

    expect(result.entries.map((entry) => entry.bookId)).not.toContain(
      'pausado',
    );
  });

  it('livro ativo sem páginas restantes cai para a fila', () => {
    const concluido = book({ id: 'a', pages: 300, pagesRead: 300 });
    const proximo = book({ id: 'b', genreId: 'romance', status: 'queued' });
    const result = plan({
      books: [concluido, proximo],
      sessions: [session('a')],
    });

    expect(result.entries).toEqual([
      {
        bookId: 'b',
        pages: 18,
        source: 'queue',
        finishes: false,
        suggestion: false,
      },
    ]);
  });

  it('quero ler antes do lendo não vira principal', () => {
    const naFila = book({ id: 'a', status: 'queued' });
    const lendo = book({ id: 'b', genreId: 'romance' });
    const result = plan({
      books: [naFila, lendo],
      queueBookIds: ['a', 'b'],
    });

    expect(result.entries[0]).toMatchObject({
      bookId: 'b',
      source: 'active',
    });
  });

  it('lendo sem sessão recente continua principal', () => {
    const antigo = book({ id: 'antigo' });
    const proximo = book({
      id: 'proximo',
      genreId: 'romance',
      status: 'queued',
    });
    const result = plan({
      books: [antigo, proximo],
      sessions: [session('antigo', 7), session('fantasma', 0)],
    });

    expect(result.lightDay).toBe(false);
    expect(result.entries[0]).toMatchObject({
      bookId: 'antigo',
      source: 'active',
    });
  });

  it('o primeiro lendo da fila é o principal', () => {
    const a = book({ id: 'a' });
    const b = book({ id: 'b', genreId: 'romance' });
    const result = plan({
      books: [a, b],
      queueBookIds: ['b', 'a'],
    });

    expect(result.entries[0]).toMatchObject({ bookId: 'b', source: 'active' });
  });

  it('fila ignora id de livro concluído', () => {
    const ativo = book({ id: 'ativo' });
    const concluido = book({
      id: 'concluido',
      status: 'finished',
      pagesRead: 300,
    });
    const proximo = book({
      id: 'proximo',
      genreId: 'romance',
      status: 'queued',
    });
    const result = plan({
      books: [ativo, concluido, proximo],
      sessions: [session('ativo')],
      queueBookIds: ['concluido', 'proximo', 'ativo'],
    });

    expect(result.entries.map((entry) => entry.bookId)).toEqual([
      'ativo',
      'proximo',
    ]);
  });

  it('fila com ids desconhecidos usa a ordem recebida', () => {
    const primeiro = book({ id: 'a', status: 'queued' });
    const segundo = book({ id: 'b', status: 'queued' });
    const result = plan({
      books: [primeiro, segundo],
      queueBookIds: ['fantasma'],
    });

    expect(result.entries[0]?.bookId).toBe('a');
  });

  it('ids repetidos na fila não duplicam o plano', () => {
    const primeiro = book({ id: 'a', status: 'queued' });
    const segundo = book({ id: 'b', status: 'queued' });
    const result = plan({
      books: [primeiro, segundo],
      queueBookIds: ['a', 'a', 'b'],
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.bookId).toBe('a');
  });
});

describe('buildPlan — invariantes', () => {
  const books = [
    book({ id: 'a' }),
    book({ id: 'b', genreId: 'romance', status: 'queued' }),
    book({ id: 'c', genreId: 'scifi', status: 'queued' }),
  ];

  it('nunca passa da meta nem do restante de cada livro', () => {
    for (let goal = 3; goal <= 40; goal += 1) {
      const result = plan({
        goalPages: goal,
        books,
        sessions: [session('a')],
      });

      expect(result.pages).toBeLessThanOrEqual(goal);
      expect(result.pages).toBe(
        result.entries.reduce((total, entry) => total + entry.pages, 0),
      );

      for (const entry of result.entries) {
        const source = books.find((item) => item.id === entry.bookId);

        expect(source).toBeDefined();
        if (!source) {
          continue;
        }

        expect(entry.pages).toBeGreaterThan(0);
        expect(entry.pages).toBeLessThanOrEqual(
          source.pages - Math.max(0, source.pagesRead),
        );
      }
    }
  });

  it('não repete livro e não cria bloco de 0 página', () => {
    const result = plan({
      goalPages: 40,
      books,
      sessions: [session('a')],
    });
    const ids = result.entries.map((entry) => entry.bookId);

    expect(new Set(ids).size).toBe(ids.length);
    expect(result.entries.every((entry) => entry.pages > 0)).toBe(true);
  });

  it('a mesma entrada devolve a mesma saída', () => {
    const input: PlannerInput = {
      today,
      goalPages: 18,
      books,
      sessions: [session('a')],
      queueBookIds: ['b', 'a'],
    };

    expect(buildPlan(input)).toEqual(buildPlan(input));
  });

  it('não desconta a leitura de hoje: o plano é bruto', () => {
    const ativo = book({ id: 'ativo', pages: 300, pagesRead: 5 });
    const proximo = book({
      id: 'proximo',
      genreId: 'romance',
      status: 'queued',
    });
    const result = plan({
      books: [ativo, proximo],
      sessions: [session('ativo')],
    });

    expect(result.pages).toBe(18);
    expect(pagesByBook(result)).toEqual({ ativo: 11, proximo: 7 });
  });

  it('devolve o dia local no formato YYYY-MM-DD', () => {
    const result = plan({
      today: new Date(2026, 0, 5, 23, 59),
      books: [],
    });

    expect(result.date).toBe('2026-01-05');
  });
});
