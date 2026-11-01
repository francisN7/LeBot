import { createBooksRepository } from '@/db/repositories/books';
import {
  createReviewFieldsRepository,
  DUPLICATE_REVIEW_FIELD,
} from '@/db/repositories/review-fields';
import { createReviewsRepository } from '@/db/repositories/reviews';
import { createTestDatabase } from '@/test-utils/sqlite';

async function createRepositories() {
  const db = await createTestDatabase();
  const books = createBooksRepository(db);

  const book = books.create({
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'finished',
    pages: 310,
  });

  return {
    db,
    books,
    fields: createReviewFieldsRepository(db),
    reviews: createReviewsRepository(db),
    book,
  };
}

describe('review fields repository', () => {
  it('começa sem campos e cria na ordem de cadastro', async () => {
    const { fields } = await createRepositories();

    expect(fields.list()).toEqual([]);

    const first = fields.create({ name: 'O que melhorar?' });
    const second = fields.create({ name: '  Que repertório me deu?  ' });

    expect(first.id).toMatch(/^field-/);
    expect(first.sortOrder).toBe(0);
    expect(second.name).toBe('Que repertório me deu?');
    expect(second.sortOrder).toBe(1);
    expect(fields.list().map((field) => field.name)).toEqual([
      'O que melhorar?',
      'Que repertório me deu?',
    ]);
  });

  it('recusa nome vazio ou acima de 40 caracteres', async () => {
    const { fields } = await createRepositories();

    expect(() => fields.create({ name: '   ' })).toThrow('Dê um nome ao campo');
    expect(() => fields.create({ name: 'a'.repeat(41) })).toThrow(
      'Use até 40 caracteres',
    );
  });

  it('recusa nomes iguais sem diferenciar caixa', async () => {
    const { fields } = await createRepositories();
    fields.create({ name: 'O que melhorar?' });

    expect(() => fields.create({ name: 'o que MELHORAR?' })).toThrow(
      DUPLICATE_REVIEW_FIELD,
    );
  });

  it('renomeia mantendo o id e recusa nome de outro campo', async () => {
    const { fields } = await createRepositories();
    const first = fields.create({ name: 'Impressões' });
    fields.create({ name: 'Repertório' });

    const renamed = fields.rename(first.id, 'Primeiras impressões');

    expect(renamed?.id).toBe(first.id);
    expect(renamed?.name).toBe('Primeiras impressões');
    expect(() => fields.rename(first.id, 'repertório')).toThrow(
      DUPLICATE_REVIEW_FIELD,
    );
    expect(fields.rename('nao-existe', 'Qualquer')).toBeUndefined();
  });

  it('excluir o campo limpa os valores nas resenhas', async () => {
    const { fields, reviews, book } = await createRepositories();
    const field = fields.create({ name: 'O que não gostei?' });
    reviews.save({
      bookId: book.id,
      rating: 2,
      extras: { [field.id]: 'O ritmo.', outro: 'Fica.' },
    });

    expect(fields.remove(field.id)).toBe(true);
    expect(reviews.findByBook(book.id)?.extras).toEqual({ outro: 'Fica.' });
    expect(fields.remove(field.id)).toBe(false);
  });
});
