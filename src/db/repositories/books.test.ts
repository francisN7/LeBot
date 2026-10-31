import { createBooksRepository } from '@/db/repositories/books';
import { createTestDatabase } from '@/test-utils/sqlite';

const baseBook = {
  title: 'O Hobbit',
  author: 'J. R. R. Tolkien',
  genre: 'fantasy',
  status: 'reading',
  pages: 310,
  pagesRead: 128,
} as const;

describe('books repository', () => {
  it('cria, lista e busca por id', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);

    const created = repository.create({ ...baseBook, id: 'book-hobbit' });

    expect(created.id).toBe('book-hobbit');
    expect(created.title).toBe('O Hobbit');
    expect(created.pagesRead).toBe(128);
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(repository.list()).toHaveLength(1);
    expect(repository.findById('book-hobbit')?.title).toBe('O Hobbit');
    expect(repository.findById('nao-existe')).toBeUndefined();
  });

  it('gera id quando o input não traz um', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);

    const created = repository.create(baseBook);

    expect(created.id).toMatch(/^book-/);
  });

  it('atualiza campos e o updatedAt', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);
    const created = repository.create({ ...baseBook, id: 'book-1' });

    const updated = repository.update('book-1', {
      status: 'finished',
      pagesRead: 310,
    });

    expect(updated?.status).toBe('finished');
    expect(updated?.pagesRead).toBe(310);
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime(),
    );
  });

  it('devolve undefined ao atualizar livro inexistente', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);

    expect(
      repository.update('nao-existe', { status: 'paused' }),
    ).toBeUndefined();
  });

  it('remove e informa se algo foi apagado', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);
    repository.create({ ...baseBook, id: 'book-1' });

    expect(repository.remove('book-1')).toBe(true);
    expect(repository.remove('book-1')).toBe(false);
    expect(repository.list()).toHaveLength(0);
  });

  it('rejeita título vazio e páginas inválidas', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);

    expect(() => repository.create({ ...baseBook, title: '   ' })).toThrow();
    expect(() => repository.create({ ...baseBook, pages: 0 })).toThrow();
    expect(() => repository.create({ ...baseBook, pagesRead: 311 })).toThrow();
  });

  it('valida o livro completo ao atualizar um campo só', async () => {
    const db = await createTestDatabase();
    const repository = createBooksRepository(db);
    repository.create({ ...baseBook, id: 'book-1' });

    expect(() => repository.update('book-1', { pagesRead: 999 })).toThrow();
    expect(repository.findById('book-1')?.pagesRead).toBe(128);
  });
});
