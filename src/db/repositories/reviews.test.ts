import { createBooksRepository } from '@/db/repositories/books';
import {
  BOOK_NOT_FOUND,
  createReviewsRepository,
  INVALID_RATING,
} from '@/db/repositories/reviews';
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
    reviews: createReviewsRepository(db),
    book,
  };
}

describe('reviews repository', () => {
  it('grava e lê a resenha completa do livro', async () => {
    const { reviews, book } = await createRepositories();

    const saved = reviews.save({
      bookId: book.id,
      rating: 4,
      text: 'Começa devagar e termina numa aventura gostosa.',
      quote: 'Em um buraco no chão vivia um hobbit.',
      extras: { field_melhoria: '  Menos música.  ' },
    });

    expect(saved.bookId).toBe(book.id);
    expect(reviews.findByBook(book.id)).toMatchObject({
      rating: 4,
      text: 'Começa devagar e termina numa aventura gostosa.',
      quote: 'Em um buraco no chão vivia um hobbit.',
      extras: { field_melhoria: 'Menos música.' },
    });
  });

  it('atualiza a mesma linha ao salvar de novo, preservando created_at', async () => {
    const { reviews, book } = await createRepositories();

    const first = reviews.save({ bookId: book.id, rating: 3 });
    const second = reviews.save({
      bookId: book.id,
      rating: 5,
      text: 'Melhor na releitura.',
      extras: { field_repertorio: 'Mitologia nórdica.' },
    });

    expect(reviews.list()).toHaveLength(1);
    expect(second.createdAt).toEqual(first.createdAt);
    expect(second.rating).toBe(5);
    expect(second.text).toBe('Melhor na releitura.');
    expect(second.quote).toBeNull();
    expect(second.extras).toEqual({
      field_repertorio: 'Mitologia nórdica.',
    });
  });

  it('descarta texto vazio e chaves sem valor nos extras', async () => {
    const { reviews, book } = await createRepositories();

    const saved = reviews.save({
      bookId: book.id,
      rating: 2,
      text: '   ',
      quote: '',
      extras: {
        field_a: '   ',
        '  ': 'sem chave',
        field_b: ' Guardado ',
      },
    });

    expect(saved.text).toBeNull();
    expect(saved.quote).toBeNull();
    expect(saved.extras).toEqual({ field_b: 'Guardado' });
  });

  it.each([0, 6, 1.5, -1])('recusa nota inválida: %p', async (rating) => {
    const { reviews, book } = await createRepositories();

    expect(() => reviews.save({ bookId: book.id, rating })).toThrow(
      INVALID_RATING,
    );
    expect(reviews.list()).toHaveLength(0);
  });

  it('recusa resenha de livro inexistente', async () => {
    const { reviews } = await createRepositories();

    expect(() => reviews.save({ bookId: 'nao-existe', rating: 4 })).toThrow(
      BOOK_NOT_FOUND,
    );
  });

  it('remove a resenha e devolve se havia linha', async () => {
    const { reviews, book } = await createRepositories();
    reviews.save({ bookId: book.id, rating: 4 });

    expect(reviews.remove(book.id)).toBe(true);
    expect(reviews.findByBook(book.id)).toBeUndefined();
    expect(reviews.remove(book.id)).toBe(false);
  });

  it('excluir o livro apaga a resenha na mesma operação', async () => {
    const { books, reviews, book } = await createRepositories();
    reviews.save({ bookId: book.id, rating: 4 });

    expect(books.remove(book.id)).toBe(true);
    expect(reviews.findByBook(book.id)).toBeUndefined();
  });

  it('limpa a chave de um campo em todas as resenhas', async () => {
    const { books, reviews, book } = await createRepositories();
    const other = books.create({
      title: 'Pedra do Sol',
      author: 'Autor',
      genreId: 'fantasy',
      status: 'finished',
      pages: 100,
    });
    reviews.save({
      bookId: book.id,
      rating: 4,
      extras: { field_a: 'Um', field_b: 'Dois' },
    });
    reviews.save({
      bookId: other.id,
      rating: 3,
      extras: { field_b: 'Três' },
    });

    expect(reviews.stripField('field_b')).toBe(2);
    expect(reviews.findByBook(book.id)?.extras).toEqual({ field_a: 'Um' });
    expect(reviews.findByBook(other.id)?.extras).toEqual({});
    expect(reviews.stripField('field_b')).toBe(0);
  });
});
