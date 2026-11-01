import { createBackupRepository } from '@/db/repositories/backup';
import { createBooksRepository } from '@/db/repositories/books';
import { createQueueRepository } from '@/db/repositories/queue';
import { createReadingSessionsRepository } from '@/db/repositories/reading-sessions';
import { createReviewFieldsRepository } from '@/db/repositories/review-fields';
import { createReviewsRepository } from '@/db/repositories/reviews';
import { createSettingsRepository } from '@/db/repositories/settings';
import { books, queueItems } from '@/db/schema';
import { SEED_FLAG, SEED_VERSION } from '@/db/seed';
import { createTestDatabase } from '@/test-utils/sqlite';

async function setup() {
  const db = await createTestDatabase();
  const booksRepository = createBooksRepository(db);
  const queueRepository = createQueueRepository(db);
  const sessions = createReadingSessionsRepository(db);
  const fields = createReviewFieldsRepository(db);
  const reviews = createReviewsRepository(db);
  const settings = createSettingsRepository(db);
  const backup = createBackupRepository(db);

  settings.set('goal.pages', '18');
  settings.set(SEED_FLAG, SEED_VERSION);

  booksRepository.create({
    id: 'book-1',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 100,
  });
  booksRepository.create({
    id: 'book-2',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genreId: 'nonfiction',
    status: 'queued',
    pages: 200,
  });
  queueRepository.sync();
  sessions.create({
    bookId: 'book-1',
    pages: 10,
    readAt: new Date('2026-01-02T12:00:00.000Z'),
  });
  const field = fields.create({ name: 'O que aprendi?' });
  reviews.save({
    bookId: 'book-1',
    rating: 4,
    text: 'Bom',
    quote: null,
    extras: { [field.id]: 'Muito' },
  });

  return {
    db,
    backup,
    booksRepository,
    queueRepository,
    settings,
  };
}

describe('backup repository', () => {
  it('exporta todas as tabelas e conta o que existe', async () => {
    const { backup } = await setup();
    const tables = backup.exportAll();

    expect(tables.genres).toHaveLength(6);
    expect(tables.books).toHaveLength(2);
    expect(tables.readingSessions).toHaveLength(1);
    expect(tables.queueItems).toHaveLength(2);
    expect(tables.reviews).toHaveLength(1);
    expect(tables.reviewFields).toHaveLength(1);
    expect(tables.settings.some((row) => row.key === 'goal.pages')).toBe(true);
    expect(backup.counts()).toMatchObject({
      books: 2,
      sessions: 1,
      reviews: 1,
      genres: 6,
      reviewFields: 1,
      queueItems: 2,
    });
  });

  it('faz round-trip completo no SQLite', async () => {
    const { backup } = await setup();
    const before = backup.exportAll();

    backup.replaceAll(before);

    expect(backup.exportAll()).toEqual(before);
  });

  it('substitui os dados antigos em vez de mesclar', async () => {
    const { backup, booksRepository } = await setup();
    const snapshot = backup.exportAll();

    booksRepository.create({
      id: 'book-3',
      title: 'Coraline',
      author: 'Neil Gaiman',
      genreId: 'horror',
      status: 'paused',
      pages: 208,
    });

    backup.replaceAll(snapshot);

    expect(backup.exportAll().books.map((book) => book.id)).toEqual([
      'book-1',
      'book-2',
    ]);
  });

  it('repõe o flag de seed mesmo quando o backup não o traz', async () => {
    const { backup, settings } = await setup();
    const snapshot = backup.exportAll();
    snapshot.settings = snapshot.settings.filter(
      (row) => row.key !== SEED_FLAG,
    );

    backup.replaceAll(snapshot);

    expect(settings.get(SEED_FLAG)).toBe(SEED_VERSION);
  });

  it('limpa a capa sem mexer no updatedAt', async () => {
    const { backup, booksRepository } = await setup();
    const updated = booksRepository.update('book-1', {
      coverUri: 'file:///covers/book-1.jpg',
    });

    expect(updated?.coverUri).toBe('file:///covers/book-1.jpg');

    backup.clearCoverUris(['book-1']);

    const after = booksRepository.findById('book-1');

    expect(after?.coverUri).toBeNull();
    expect(after?.updatedAt).toEqual(updated?.updatedAt);
  });

  it('mantém o banco intacto quando uma inserção falha', async () => {
    const { backup } = await setup();
    const snapshot = backup.exportAll();
    const broken = backup.exportAll();

    const firstGenre = broken.genres[0];
    const secondGenre = broken.genres[1];

    if (!firstGenre || !secondGenre) {
      throw new Error('fixture sem gêneros');
    }

    secondGenre.name = firstGenre.name;

    expect(() => backup.replaceAll(broken)).toThrow();
    expect(backup.exportAll()).toEqual(snapshot);
  });

  it('tira da fila o que não é livro válido e renumera', async () => {
    const { db, backup } = await setup();
    const now = new Date();

    db.insert(books)
      .values({
        id: 'book-3',
        title: 'Fim',
        author: 'Autora',
        genreId: 'fantasy',
        status: 'finished',
        pages: 10,
        pagesRead: 10,
        isbn: null,
        coverUri: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    db.insert(queueItems)
      .values({
        bookId: 'book-3',
        position: 0,
        note: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    db.insert(queueItems)
      .values({
        bookId: 'livro-sumido',
        position: 1,
        note: null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const tables = backup.exportAll();

    expect(tables.queueItems.map((row) => row.bookId)).toEqual([
      'book-1',
      'book-2',
    ]);
    expect(tables.queueItems.map((row) => row.position)).toEqual([0, 1]);
  });
});
