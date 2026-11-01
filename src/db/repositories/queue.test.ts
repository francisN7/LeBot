import { asc } from 'drizzle-orm';

import type { CreateBookInput } from '@/db/repositories/books';
import { createBooksRepository } from '@/db/repositories/books';
import {
  createQueueRepository,
  QUEUE_BOOK_FINISHED,
  QUEUE_BOOK_NOT_FOUND,
} from '@/db/repositories/queue';
import { queueItems } from '@/db/schema';
import { createTestDatabase } from '@/test-utils/sqlite';

const baseBook: CreateBookInput = {
  id: 'book-1',
  title: 'O Hobbit',
  author: 'J. R. R. Tolkien',
  genreId: 'fantasy',
  status: 'queued',
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

  return { db, books, repository: createQueueRepository(db) };
}

function positions(db: Awaited<ReturnType<typeof setup>>['db']) {
  return db
    .select({ bookId: queueItems.bookId, position: queueItems.position })
    .from(queueItems)
    .orderBy(asc(queueItems.position))
    .all();
}

describe('queue repository', () => {
  it('adiciona no fim e não duplica o mesmo livro', async () => {
    const { repository } = await setup();

    repository.add('book-1');
    repository.add('book-2');
    const duplicate = repository.add('book-1');

    expect(duplicate.bookId).toBe('book-1');
    expect(repository.list().map((row) => row.bookId)).toEqual([
      'book-1',
      'book-2',
    ]);
  });

  it('recusa livro inexistente e concluído', async () => {
    const { repository } = await setup();

    expect(() => repository.add('book-unknown')).toThrow(QUEUE_BOOK_NOT_FOUND);
    expect(() => repository.add('book-4')).toThrow(QUEUE_BOOK_FINISHED);
    expect(repository.list()).toHaveLength(0);
  });

  it('não muda o status do livro ao entrar na ordem', async () => {
    const { books, repository } = await setup();

    repository.add('book-3');

    expect(books.findById('book-3')?.status).toBe('paused');
  });

  it('remove e compacta as posições', async () => {
    const { db, repository } = await setup();
    repository.add('book-1');
    repository.add('book-2');
    repository.add('book-3');

    expect(repository.remove('book-2')).toBe(true);
    expect(repository.remove('book-2')).toBe(false);
    expect(positions(db)).toEqual([
      { bookId: 'book-1', position: 0 },
      { bookId: 'book-3', position: 1 },
    ]);
  });

  it('move para posição e reescreve a lista compacta', async () => {
    const { db, repository } = await setup();
    repository.add('book-1');
    repository.add('book-2');
    repository.add('book-3');

    expect(repository.move('book-3', 0).map((row) => row.bookId)).toEqual([
      'book-3',
      'book-1',
      'book-2',
    ]);
    expect(repository.move('book-3', 2).map((row) => row.bookId)).toEqual([
      'book-1',
      'book-2',
      'book-3',
    ]);
    expect(positions(db).map((row) => row.position)).toEqual([0, 1, 2]);
  });

  it('limita a posição ao início e ao fim da lista', async () => {
    const { repository } = await setup();
    repository.add('book-1');
    repository.add('book-2');

    expect(repository.move('book-2', -10).map((row) => row.bookId)).toEqual([
      'book-2',
      'book-1',
    ]);
    expect(repository.move('book-2', 99).map((row) => row.bookId)).toEqual([
      'book-1',
      'book-2',
    ]);
  });

  it('substitui a ordem inteira, sem duplicar nem aceitar concluído', async () => {
    const { db, repository } = await setup();
    repository.add('book-1');
    repository.add('book-2');

    const rows = repository.replaceAll([
      'book-3',
      'book-1',
      'book-3',
      'book-4',
      'book-unknown',
    ]);

    expect(rows.map((row) => row.bookId)).toEqual(['book-3', 'book-1']);
    expect(positions(db)).toEqual([
      { bookId: 'book-3', position: 0 },
      { bookId: 'book-1', position: 1 },
    ]);
  });

  it('ignora livro concluído ou excluído na leitura', async () => {
    const { books, repository } = await setup();
    repository.add('book-1');
    repository.add('book-2');
    repository.add('book-3');

    books.update('book-2', { status: 'finished' });
    books.remove('book-3');

    expect(repository.list().map((row) => row.bookId)).toEqual(['book-1']);
  });

  it('guarda a nota opcional sem mudar a posição', async () => {
    const { repository } = await setup();
    repository.add('book-1', '  ler no fim de semana  ');

    expect(repository.list()[0]?.note).toBe('ler no fim de semana');
  });
});
