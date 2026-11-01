import { asc } from 'drizzle-orm';

import type { CreateBookInput } from '@/db/repositories/books';
import { createBooksRepository } from '@/db/repositories/books';
import { createQueueRepository } from '@/db/repositories/queue';
import { queueItems } from '@/db/schema';
import { createTestDatabase } from '@/test-utils/sqlite';

const baseBook: CreateBookInput = {
  id: 'book-1',
  title: 'O Hobbit',
  author: 'J. R. R. Tolkien',
  genreId: 'fantasy',
  status: 'reading',
  pages: 100,
};

async function setup() {
  const db = await createTestDatabase();
  const books = createBooksRepository(db);

  books.create(baseBook);
  books.create({
    ...baseBook,
    id: 'book-2',
    title: 'Sapiens',
    genreId: 'nonfiction',
    status: 'queued',
  });
  books.create({
    ...baseBook,
    id: 'book-3',
    title: 'Coraline',
    genreId: 'horror',
    status: 'paused',
  });
  books.create({
    ...baseBook,
    id: 'book-4',
    title: 'O Pequeno Príncipe',
    genreId: 'children',
    status: 'finished',
  });
  books.create({
    ...baseBook,
    id: 'book-5',
    title: 'Orgulho e Preconceito',
    genreId: 'classic',
    status: 'reading',
  });

  return { db, books, repository: createQueueRepository(db) };
}

function ids(rows: { bookId: string }[]): string[] {
  return rows.map((row) => row.bookId);
}

function stored(db: Awaited<ReturnType<typeof setup>>['db']) {
  return db
    .select({ bookId: queueItems.bookId, position: queueItems.position })
    .from(queueItems)
    .orderBy(asc(queueItems.position))
    .all();
}

describe('queue repository', () => {
  it('inclui todo livro não concluído, com Lendo no bloco de cima', async () => {
    const { repository } = await setup();

    expect(ids(repository.list())).toEqual([
      'book-1',
      'book-5',
      'book-2',
      'book-3',
    ]);
    expect(repository.list().map((row) => row.position)).toEqual([0, 1, 2, 3]);
  });

  it('sync materializa a ordem e respeita os blocos', async () => {
    const { db, repository } = await setup();

    repository.sync();

    expect(stored(db)).toEqual([
      { bookId: 'book-1', position: 0 },
      { bookId: 'book-5', position: 1 },
      { bookId: 'book-2', position: 2 },
      { bookId: 'book-3', position: 3 },
    ]);
  });

  it('ignora livro concluído e livro excluído', async () => {
    const { books, repository } = await setup();

    books.update('book-2', { status: 'finished' });
    books.remove('book-3');

    expect(ids(repository.list())).toEqual(['book-1', 'book-5']);
  });

  it('move dentro do bloco Lendo e troca o principal', async () => {
    const { repository } = await setup();

    expect(ids(repository.move('book-5', 0))).toEqual([
      'book-5',
      'book-1',
      'book-2',
      'book-3',
    ]);
    expect(ids(repository.move('book-1', 0))).toEqual([
      'book-1',
      'book-5',
      'book-2',
      'book-3',
    ]);
  });

  it('não deixa Lendo descer para o bloco de baixo', async () => {
    const { repository } = await setup();

    expect(ids(repository.move('book-1', 3))).toEqual([
      'book-5',
      'book-1',
      'book-2',
      'book-3',
    ]);
  });

  it('não deixa Quero ler subir para o bloco Lendo', async () => {
    const { repository } = await setup();

    expect(ids(repository.move('book-3', 0))).toEqual([
      'book-1',
      'book-5',
      'book-3',
      'book-2',
    ]);
    expect(ids(repository.move('book-2', 0))).toEqual([
      'book-1',
      'book-5',
      'book-2',
      'book-3',
    ]);
  });

  it('substitui a ordem mantendo Lendo primeiro', async () => {
    const { repository } = await setup();

    expect(
      ids(
        repository.replaceAll([
          'book-3',
          'book-5',
          'book-2',
          'book-1',
          'book-4',
          'book-unknown',
        ]),
      ),
    ).toEqual(['book-5', 'book-1', 'book-3', 'book-2']);
  });

  it('livro novo em Lendo entra no fim do bloco de cima', async () => {
    const { books, repository } = await setup();
    repository.sync();

    books.create({
      ...baseBook,
      id: 'book-6',
      title: 'Duna',
      genreId: 'scifi',
      status: 'reading',
    });
    repository.sync();

    expect(ids(repository.list())).toEqual([
      'book-1',
      'book-5',
      'book-6',
      'book-2',
      'book-3',
    ]);
  });

  it('mudar Quero ler para Lendo põe no fim do bloco de cima', async () => {
    const { books, repository } = await setup();
    repository.sync();

    books.update('book-2', { status: 'reading' });
    repository.sync();

    expect(ids(repository.list())).toEqual([
      'book-1',
      'book-5',
      'book-2',
      'book-3',
    ]);
  });

  it('mudar Lendo para Quero ler tira do bloco de cima', async () => {
    const { books, repository } = await setup();
    repository.sync();

    books.update('book-1', { status: 'queued' });
    repository.sync();

    expect(ids(repository.list())).toEqual([
      'book-5',
      'book-1',
      'book-2',
      'book-3',
    ]);
  });
});
