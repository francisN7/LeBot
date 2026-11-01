import type { BackupTables } from '@/db/repositories';
import { SEED_FLAG } from '@/db/seed';
import { testBookRows, testGenreRows } from '@/test-utils/repositories';

import {
  backupFileName,
  countBackup,
  formatBackupDate,
  parseBackup,
  serializeBackup,
  validateBackup,
  withCoverUris,
} from './format';
import { backupCountsLabel } from './labels';

const baseTime = new Date('2026-01-01T12:00:00.000Z');
const exportedAt = new Date('2026-11-01T18:00:00.000Z');
const coverIds = new Set(['book-hobbit']);

function makeTables(): BackupTables {
  return {
    genres: testGenreRows.map((row) => ({ ...row })),
    reviewFields: [
      {
        id: 'field-1',
        name: 'O que aprendi?',
        sortOrder: 0,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    // O caminho já está no formato portátil: `validateBackup` recebe o que
    // saiu do JSON, não a linha crua do banco.
    books: testBookRows.map((row, index) => ({
      ...row,
      coverUri: index === 0 ? 'covers/book-hobbit.jpg' : row.coverUri,
    })),
    readingSessions: [
      {
        id: 'session-1',
        bookId: 'book-hobbit',
        pages: 12,
        readAt: baseTime,
        appliedPages: 12,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    queueItems: [
      {
        bookId: 'book-hobbit',
        position: 0,
        note: null,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    reviews: [
      {
        bookId: 'book-pequeno-principe',
        rating: 5,
        text: 'Gostei',
        quote: 'Uma frase',
        extras: { 'field-1': 'Aprendi' },
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    settings: [
      { key: 'goal.pages', value: '18' },
      { key: SEED_FLAG, value: '1' },
    ],
  };
}

function serialize(tables: BackupTables): string {
  return serializeBackup(tables, { exportedAt, appVersion: '0.1.0' }, coverIds);
}

function at<T>(rows: readonly T[], index: number): T {
  const row = rows[index];

  if (!row) {
    throw new Error(`fixture sem a linha ${index}`);
  }

  return row;
}

describe('serializeBackup + parseBackup', () => {
  it('faz round-trip de todas as tabelas, datas e capa', () => {
    const tables = makeTables();
    const json = serialize(tables);
    const parsed = parseBackup(json);

    validateBackup(parsed.tables, coverIds);

    const expected = {
      ...tables,
      books: tables.books.map((book) =>
        coverIds.has(book.id)
          ? { ...book, coverUri: 'covers/book-hobbit.jpg' }
          : book,
      ),
      settings: [
        ...tables.settings,
        {
          key: 'backup.last_exported_at',
          value: exportedAt.toISOString(),
        },
      ].sort((first, second) => first.key.localeCompare(second.key)),
    };

    expect(parsed.exportedAt).toEqual(exportedAt);
    expect(parsed.appVersion).toBe('0.1.0');
    expect(parsed.tables).toEqual(expected);
  });

  it('grava a capa como caminho relativo e a data do export', () => {
    const payload = JSON.parse(serialize(makeTables()));

    expect(payload.data.books[0].cover_uri).toBe('covers/book-hobbit.jpg');
    expect(payload.data.books[1].cover_uri).toBeNull();
    expect(
      payload.data.settings.find(
        (row: { key: string }) => row.key === 'backup.last_exported_at',
      ).value,
    ).toBe(exportedAt.toISOString());
  });

  it('recusa JSON inválido, sem versão e versão diferente', () => {
    expect(() => parseBackup('{')).toThrow('JSON válido');
    expect(() => parseBackup('{}')).toThrow('versão de backup');
    expect(() => parseBackup(JSON.stringify({ formatVersion: 2 }))).toThrow(
      'formato 2',
    );
  });

  it('recusa tabela ou linha com forma inválida', () => {
    const payload = JSON.parse(serialize(makeTables()));
    delete payload.data.books;

    expect(() => parseBackup(JSON.stringify(payload))).toThrow(
      'campo inválido',
    );

    const badRow = JSON.parse(serialize(makeTables()));
    badRow.data.books[0].pages = -1;

    expect(() => parseBackup(JSON.stringify(badRow))).toThrow('campo inválido');
  });
});

describe('validateBackup', () => {
  it('recusa backup sem gênero', () => {
    const tables = makeTables();
    tables.genres = [];

    expect(() => validateBackup(tables, coverIds)).toThrow('nenhum gênero');
  });

  it('recusa ids repetidos', () => {
    const tables = makeTables();
    at(tables.books, 1).id = at(tables.books, 0).id;

    expect(() => validateBackup(tables, coverIds)).toThrow(
      'mesmo identificador',
    );
  });

  it('recusa ISBN repetido e inválido', () => {
    const duplicated = makeTables();
    at(duplicated.books, 0).isbn = '9788535902778';
    at(duplicated.books, 1).isbn = '9788535902778';

    expect(() => validateBackup(duplicated, coverIds)).toThrow('mesmo ISBN');

    const invalid = makeTables();
    at(invalid.books, 0).isbn = '123';

    expect(() => validateBackup(invalid, coverIds)).toThrow('ISBN');
  });

  it('recusa nome de gênero repetido sem diferenciar caixa', () => {
    const tables = makeTables();
    at(tables.genres, 1).name = at(tables.genres, 0).name.toUpperCase();

    expect(() => validateBackup(tables, coverIds)).toThrow('mesmo nome');
  });

  it('recusa gênero, resenha e ordem apontando para livro inexistente', () => {
    const noGenre = makeTables();
    at(noGenre.books, 0).genreId = 'missing';

    expect(() => validateBackup(noGenre, coverIds)).toThrow(
      'gênero que não está no backup',
    );

    const noBook = makeTables();
    at(noBook.reviews, 0).bookId = 'missing';

    expect(() => validateBackup(noBook, coverIds)).toThrow(
      'resenha para um livro que não existe',
    );

    const noQueueBook = makeTables();
    at(noQueueBook.queueItems, 0).bookId = 'missing';

    expect(() => validateBackup(noQueueBook, coverIds)).toThrow(
      'item de ordem para um livro que não existe',
    );
  });

  it('recusa livro concluído na ordem', () => {
    const tables = makeTables();
    at(tables.queueItems, 0).bookId = 'book-pequeno-principe';

    expect(() => validateBackup(tables, coverIds)).toThrow(
      'na ordem mesmo estando concluído',
    );
  });

  it('confere capa nos dois sentidos', () => {
    const withoutEntry = makeTables();

    expect(() => validateBackup(withoutEntry, new Set())).toThrow(
      'não está dentro do arquivo',
    );

    const withoutBook = makeTables();
    at(withoutBook.books, 0).coverUri = null;

    expect(() => validateBackup(withoutBook, coverIds)).toThrow(
      'sem o livro apontar',
    );

    const wrongPath = makeTables();
    at(wrongPath.books, 0).coverUri = 'covers/outro.jpg';

    expect(() => validateBackup(wrongPath, coverIds)).toThrow(
      'caminho inesperado',
    );

    expect(() =>
      validateBackup(makeTables(), new Set(['book-hobbit', 'book-fantasma'])),
    ).toThrow('não pertence a nenhum livro');
  });

  it('recusa meta fora do intervalo', () => {
    const tables = makeTables();
    tables.settings = [{ key: 'goal.pages', value: '2' }];

    expect(() => validateBackup(tables, coverIds)).toThrow(
      'entre 3 e 200 páginas',
    );
  });

  it('recusa progresso incoerente', () => {
    const overRead = makeTables();
    at(overRead.books, 0).pagesRead = at(overRead.books, 0).pages + 1;

    expect(() => validateBackup(overRead, coverIds)).toThrow(
      'mais páginas lidas',
    );

    const notFinished = makeTables();
    const finished = notFinished.books.find(
      (book) => book.status === 'finished',
    );

    if (finished) {
      finished.pagesRead = finished.pages - 1;
    }

    expect(() => validateBackup(notFinished, coverIds)).toThrow(
      'não chegou ao total',
    );

    const session = makeTables();
    at(session.readingSessions, 0).appliedPages = 13;

    expect(() => validateBackup(session, coverIds)).toThrow(
      'páginas aplicadas',
    );
  });

  it('recusa valor de resenha para campo inexistente', () => {
    const tables = makeTables();
    at(tables.reviews, 0).extras = { 'field-x': 'texto' };

    expect(() => validateBackup(tables, coverIds)).toThrow(
      'campo que não existe',
    );
  });
});

describe('helpers do backup', () => {
  it('troca caminhos relativos pelos caminhos do aparelho', () => {
    const parsed = parseBackup(serialize(makeTables()));
    const withUris = withCoverUris(
      parsed.tables,
      new Map([['book-hobbit', 'file:///novo/book-hobbit.jpg']]),
    );

    expect(at(withUris.books, 0).coverUri).toBe('file:///novo/book-hobbit.jpg');
    expect(at(withUris.books, 1).coverUri).toBeNull();
  });

  it('conta as tabelas e monta o rótulo', () => {
    const counts = countBackup(makeTables());

    expect(counts).toMatchObject({
      books: 5,
      sessions: 1,
      reviews: 1,
      genres: 6,
      reviewFields: 1,
      queueItems: 1,
    });
    expect(backupCountsLabel(counts)).toBe('5 livros, 1 sessão e 1 resenha');
    expect(backupCountsLabel({ books: 1, sessions: 1, reviews: 1 })).toBe(
      '1 livro, 1 sessão e 1 resenha',
    );
  });

  it('formata a data e o nome do arquivo sem depender do locale', () => {
    const date = new Date(2026, 10, 1, 18, 5);

    expect(formatBackupDate(date)).toBe('1 de novembro de 2026, 18:05');
    expect(backupFileName(date)).toBe('lebot-backup-2026-11-01.zip');
    expect(formatBackupDate(new Date('invalid'))).toBe('');
  });
});
