import { suggestOrder } from './suggest-order';

function book(id: string, genreId: string) {
  return { id, genreId };
}

describe('suggestOrder', () => {
  it('devolve vazio para ordem vazia', () => {
    expect(suggestOrder([])).toEqual([]);
  });

  it('mantém a ordem com um livro só', () => {
    const items = [book('a', 'fantasy')];

    expect(suggestOrder(items)).toEqual(items);
  });

  it('não muda a ordem quando todos são do mesmo gênero', () => {
    const items = [
      book('a', 'fantasy'),
      book('b', 'fantasy'),
      book('c', 'fantasy'),
    ];

    expect(suggestOrder(items)).toEqual(items);
  });

  it('alterna gêneros mantendo o primeiro livro', () => {
    const items = [
      book('a', 'fantasy'),
      book('b', 'fantasy'),
      book('c', 'romance'),
    ];

    expect(suggestOrder(items).map((item) => item.id)).toEqual(['a', 'c', 'b']);
  });

  it('não perde nem duplica livro', () => {
    const items = [
      book('a', 'fantasy'),
      book('b', 'romance'),
      book('c', 'fantasy'),
      book('d', 'romance'),
      book('e', 'horror'),
    ];

    const result = suggestOrder(items);

    expect(result).toHaveLength(items.length);
    expect(new Set(result.map((item) => item.id))).toEqual(
      new Set(items.map((item) => item.id)),
    );
  });

  it('é idempotente e não muda o array recebido', () => {
    const items = [
      book('a', 'fantasy'),
      book('b', 'fantasy'),
      book('c', 'romance'),
      book('d', 'romance'),
      book('e', 'horror'),
    ];
    const original = [...items];

    const once = suggestOrder(items);
    const twice = suggestOrder(once);

    expect(twice).toEqual(once);
    expect(items).toEqual(original);
  });

  it('repete gênero apenas quando não há outra opção', () => {
    const items = [
      book('a', 'fantasy'),
      book('b', 'romance'),
      book('c', 'romance'),
      book('d', 'fantasy'),
    ];

    expect(suggestOrder(items).map((item) => item.genreId)).toEqual([
      'fantasy',
      'romance',
      'fantasy',
      'romance',
    ]);
  });
});
