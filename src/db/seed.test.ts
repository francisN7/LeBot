import { createBooksRepository } from '@/db/repositories/books';
import { createSettingsRepository } from '@/db/repositories/settings';
import { SEED_FLAG, SEED_VERSION, seedBooks, seedIfEmpty } from '@/db/seed';
import { createTestDatabase, runMigrations } from '@/test-utils/sqlite';

function createRepositories() {
  return createTestDatabase().then((db) => ({
    db,
    books: createBooksRepository(db),
    settings: createSettingsRepository(db),
  }));
}

describe('seed', () => {
  it('popula o banco vazio com os livros fictícios', async () => {
    const { books, settings } = await createRepositories();

    expect(seedIfEmpty(books, settings)).toBe(true);
    expect(books.list()).toHaveLength(seedBooks.length);
    expect(settings.get(SEED_FLAG)).toBe(SEED_VERSION);
  });

  it('não repete o seed na segunda execução', async () => {
    const { books, settings } = await createRepositories();

    seedIfEmpty(books, settings);
    expect(seedIfEmpty(books, settings)).toBe(false);
    expect(books.list()).toHaveLength(seedBooks.length);
  });

  it('não repõe livros que o dono apagou', async () => {
    const { books, settings } = await createRepositories();
    seedIfEmpty(books, settings);

    for (const book of books.list()) {
      books.remove(book.id);
    }

    expect(seedIfEmpty(books, settings)).toBe(false);
    expect(books.list()).toHaveLength(0);
  });

  it('não mexe em banco que já tem livros', async () => {
    const { books, settings } = await createRepositories();
    books.create({
      title: 'Livro do dono',
      author: 'Autora',
      genre: 'romance',
      status: 'reading',
      pages: 200,
    });

    expect(seedIfEmpty(books, settings)).toBe(false);
    expect(books.list()).toHaveLength(1);
  });
});

describe('migração', () => {
  it('roda uma vez e manter os dados ao rodar de novo', async () => {
    const { db, books } = await createRepositories();
    books.create({
      title: 'Persistente',
      author: 'Autora',
      genre: 'classic',
      status: 'queued',
      pages: 100,
    });

    expect(() => runMigrations(db)).not.toThrow();
    expect(books.list()).toHaveLength(1);
  });
});
