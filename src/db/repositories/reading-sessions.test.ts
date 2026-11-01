import type { CreateBookInput } from '@/db/repositories/books';
import { createBooksRepository } from '@/db/repositories/books';
import {
  BOOK_ALREADY_FINISHED,
  BOOK_NOT_FOUND,
  createReadingSessionsRepository,
} from '@/db/repositories/reading-sessions';
import { books, readingSessions } from '@/db/schema';
import { createTestDatabase } from '@/test-utils/sqlite';

const baseBook: CreateBookInput = {
  id: 'book-1',
  title: 'O Hobbit',
  author: 'J. R. R. Tolkien',
  genreId: 'fantasy',
  status: 'reading',
  pages: 100,
  pagesRead: 10,
};

async function setup(overrides: Partial<CreateBookInput> = {}) {
  const db = await createTestDatabase();
  const books = createBooksRepository(db);
  books.create({ ...baseBook, ...overrides });

  return { db, books, repository: createReadingSessionsRepository(db) };
}

describe('reading sessions repository', () => {
  it('grava a sessão e soma no progresso do livro', async () => {
    const { books, repository } = await setup();
    const readAt = new Date('2026-10-30T10:00:00.000Z');

    const write = repository.create({
      bookId: 'book-1',
      pages: 20,
      readAt,
    });

    expect(write.session.id).toMatch(/^reading-/);
    expect(write.session.bookId).toBe('book-1');
    expect(write.session.readAt).toEqual(readAt);
    expect(write.appliedPages).toBe(20);
    expect(write.book.pagesRead).toBe(30);
    expect(write.book.status).toBe('reading');
    expect(books.findById('book-1')?.pagesRead).toBe(30);
    expect(repository.listByBook('book-1')).toHaveLength(1);
  });

  it('usa agora como dia da leitura quando readAt não vem', async () => {
    const { repository } = await setup();
    const before = Date.now();

    const write = repository.create({ bookId: 'book-1', pages: 5 });

    expect(write.session.readAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('limita o progresso ao total e conclui o livro', async () => {
    const { repository } = await setup({ pagesRead: 90 });

    const write = repository.create({ bookId: 'book-1', pages: 25 });

    expect(write.session.pages).toBe(25);
    expect(write.session.appliedPages).toBe(10);
    expect(write.appliedPages).toBe(10);
    expect(write.book.pagesRead).toBe(100);
    expect(write.book.status).toBe('finished');
  });

  it('desfaz a sessão clampada devolvendo só o que entrou', async () => {
    const { repository } = await setup({ pagesRead: 90 });
    const write = repository.create({ bookId: 'book-1', pages: 25 });

    const removal = repository.remove(write.session.id);

    expect(removal?.appliedPages).toBe(10);
    expect(removal?.book?.pagesRead).toBe(90);
  });

  it('trata sessão anterior à S5.1 como páginas cheias', async () => {
    const { db, repository } = await setup();
    const time = new Date('2026-10-20T10:00:00.000Z');

    db.insert(readingSessions)
      .values({
        id: 'reading-old',
        bookId: 'book-1',
        pages: 15,
        appliedPages: null,
        readAt: time,
        createdAt: time,
        updatedAt: time,
      })
      .run();

    const removal = repository.remove('reading-old');

    expect(removal?.appliedPages).toBe(10);
    expect(removal?.book?.pagesRead).toBe(0);
  });

  it('recusa livro inexistente, páginas inválidas e livro já concluído', async () => {
    const { repository } = await setup({ pagesRead: 100, status: 'finished' });

    expect(() => repository.create({ bookId: 'book-sumiu', pages: 5 })).toThrow(
      BOOK_NOT_FOUND,
    );
    expect(() => repository.create({ bookId: 'book-1', pages: 0 })).toThrow();
    expect(() => repository.create({ bookId: 'book-1', pages: -3 })).toThrow();
    expect(() => repository.create({ bookId: 'book-1', pages: 1.5 })).toThrow();
    expect(() => repository.create({ bookId: 'book-1', pages: 5 })).toThrow(
      BOOK_ALREADY_FINISHED,
    );
    expect(repository.listByBook('book-1')).toHaveLength(0);
  });

  it('lista as sessões do livro da mais recente para a mais antiga', async () => {
    const { repository } = await setup();

    repository.create({
      bookId: 'book-1',
      pages: 5,
      readAt: new Date('2026-10-01T12:00:00.000Z'),
    });
    repository.create({
      bookId: 'book-1',
      pages: 7,
      readAt: new Date('2026-10-03T12:00:00.000Z'),
    });

    expect(repository.listByBook('book-1').map((row) => row.pages)).toEqual([
      7, 5,
    ]);
  });

  it('filtra por faixa de datas nas duas pontas', async () => {
    const { repository } = await setup();

    repository.create({
      bookId: 'book-1',
      pages: 5,
      readAt: new Date('2026-10-01T12:00:00.000Z'),
    });
    repository.create({
      bookId: 'book-1',
      pages: 7,
      readAt: new Date('2026-10-02T12:00:00.000Z'),
    });
    repository.create({
      bookId: 'book-1',
      pages: 9,
      readAt: new Date('2026-10-03T12:00:00.000Z'),
    });

    const found = repository.listBetween(
      new Date('2026-10-01T12:00:00.000Z'),
      new Date('2026-10-02T12:00:00.000Z'),
    );

    expect(found.map((row) => row.pages)).toEqual([5, 7]);
  });

  it('desfaz a sessão e desconta do progresso', async () => {
    const { books, repository } = await setup();
    const write = repository.create({ bookId: 'book-1', pages: 20 });

    const removal = repository.remove(write.session.id);

    expect(removal?.appliedPages).toBe(20);
    expect(removal?.book?.pagesRead).toBe(10);
    expect(books.findById('book-1')?.pagesRead).toBe(10);
    expect(repository.listByBook('book-1')).toHaveLength(0);
    expect(repository.remove('reading-nao-existe')).toBeUndefined();
  });

  it('volta de "concluído" para "lendo" ao desfazer o fim do livro', async () => {
    const { repository } = await setup({ pagesRead: 90 });
    const write = repository.create({ bookId: 'book-1', pages: 10 });

    expect(write.book.status).toBe('finished');

    const removal = repository.remove(write.session.id);

    expect(removal?.book?.pagesRead).toBe(90);
    expect(removal?.book?.status).toBe('reading');
  });

  it('nunca deixa o progresso negativo ao desfazer', async () => {
    const { db, repository } = await setup({ pagesRead: 90 });
    const write = repository.create({ bookId: 'book-1', pages: 10 });

    // Estado impossível pela API (o update barra), simulado para checar a guarda.
    db.update(books).set({ pagesRead: 4 }).run();

    const removal = repository.remove(write.session.id);

    expect(removal?.appliedPages).toBe(4);
    expect(removal?.book?.pagesRead).toBe(0);
  });

  it('não mexe no progresso quando o livro já foi excluído', async () => {
    const { books, repository } = await setup();
    const write = repository.create({ bookId: 'book-1', pages: 20 });
    books.remove('book-1');

    const removal = repository.remove(write.session.id);

    expect(removal?.book).toBeUndefined();
    expect(removal?.appliedPages).toBe(0);
    expect(repository.listByBook('book-1')).toHaveLength(0);
  });
});
