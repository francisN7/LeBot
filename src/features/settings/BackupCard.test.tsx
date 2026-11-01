import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { BackupTables } from '@/db/repositories';
import {
  createFakeBackupService,
  createInMemoryBackupRepository,
  emptyBackupTables,
} from '@/test-utils/backup';
import { renderWithProviders } from '@/test-utils/render';
import { BackupCard } from './BackupCard';
import { packBackupArchive, unpackBackupArchive } from './backup/archive';
import { parseBackup, serializeBackup, withCoverUris } from './backup/format';
import type { PickArchiveResult } from './backup/service';

const exportedAt = new Date('2026-11-01T18:00:00.000Z');
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

function archiveFor(
  tables: BackupTables,
  covers: Map<string, Uint8Array> = new Map(),
): Promise<Uint8Array> {
  const json = serializeBackup(
    tables,
    { exportedAt, appVersion: '0.1.0' },
    new Set(covers.keys()),
  );

  return packBackupArchive(json, covers);
}

function picked(fileName: string, bytes: Uint8Array): PickArchiveResult {
  return { canceled: false, fileName, bytes };
}

function first<T>(rows: readonly T[]): T {
  const row = rows[0];

  if (!row) {
    throw new Error('fixture sem linha');
  }

  return row;
}

function singleBookTables(): BackupTables {
  const tables = emptyBackupTables();

  tables.books = [
    { ...first(tables.books), coverUri: 'file:///covers/book-hobbit.jpg' },
  ];
  tables.reviewFields = [];
  tables.readingSessions = [];
  tables.queueItems = [];
  tables.reviews = [];

  return tables;
}

describe('BackupCard', () => {
  it('exporta as tabelas e atualiza a data do último backup', async () => {
    const service = createFakeBackupService();
    const repository = createInMemoryBackupRepository();

    await renderWithProviders(<BackupCard />, {
      backupRepository: repository,
      backupService: service,
    });

    expect(screen.getByText('Backup')).toBeOnTheScreen();
    expect(screen.getByText('Nenhum backup ainda.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('backup-exportar'));

    await waitFor(() => {
      expect(service.shares).toHaveLength(1);
    });

    expect(first(service.shares).fileName).toMatch(
      /^lebot-backup-\d{4}-\d{2}-\d{2}\.zip$/,
    );
    expect(screen.getByText(/Backup gerado:/)).toBeOnTheScreen();
    expect(screen.getByText(/Último backup:/)).toBeOnTheScreen();

    const unpacked = await unpackBackupArchive(first(service.shares).bytes);
    const parsed = parseBackup(unpacked.json);

    expect(parsed.tables.books).toHaveLength(5);
    expect(parsed.appVersion).toBe('0.1.0');
  });

  it('para o export e avisa quando uma capa sumiu do aparelho', async () => {
    const service = createFakeBackupService();

    service.missingCovers = ['O Hobbit'];

    await renderWithProviders(<BackupCard />, {
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-exportar'));

    expect(
      await screen.findByText(/Estas capas não estão mais no aparelho/),
    ).toBeOnTheScreen();
    expect(service.shares).toHaveLength(0);
  });

  it('não abre nada quando o seletor é cancelado', async () => {
    const service = createFakeBackupService();

    service.pickResult = { canceled: true };

    await renderWithProviders(<BackupCard />, {
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-restaurar'));

    expect(screen.queryByText('Restaurar backup?')).not.toBeOnTheScreen();
  });

  it('recusa arquivo que não é um backup do LêBot', async () => {
    const service = createFakeBackupService();

    service.pickResult = picked('qualquer.json', new Uint8Array([1, 2, 3, 4]));

    await renderWithProviders(<BackupCard />, {
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-restaurar'));

    expect(
      await screen.findByText(/não é um backup do LêBot/),
    ).toBeOnTheScreen();
  });

  it('mostra contagens, oferece cópia e restaura com dupla confirmação', async () => {
    const tables = singleBookTables();
    const bytes = await archiveFor(tables, new Map([['book-hobbit', jpeg]]));
    const service = createFakeBackupService();
    const repository = createInMemoryBackupRepository();
    const onRestored = jest.fn();

    service.pickResult = picked('lebot-backup-2026-11-01.zip', bytes);

    await renderWithProviders(<BackupCard onRestored={onRestored} />, {
      backupRepository: repository,
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-restaurar'));

    expect(await screen.findByText('Restaurar backup?')).toBeOnTheScreen();
    expect(
      screen.getByText('No arquivo: 1 livro, 0 sessões e 0 resenhas.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('No aparelho agora: 5 livros, 0 sessões e 0 resenhas.'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('restore-copia'));

    await waitFor(() => {
      expect(
        screen.getByText('Cópia do estado atual gerada.'),
      ).toBeOnTheScreen();
    });
    expect(service.shares).toHaveLength(1);

    await fireEvent.press(screen.getByTestId('restore-continuar'));

    expect(screen.getByText('Restaurar agora?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('restore-confirmar'));

    expect(await screen.findByText('Backup restaurado')).toBeOnTheScreen();
    expect(repository.exportAll().books).toHaveLength(1);
    expect(first(repository.exportAll().books).coverUri).toBe(
      'file:///covers/book-hobbit.jpg',
    );
    expect(service.committed).toEqual([['book-hobbit']]);

    await fireEvent.press(screen.getByTestId('restore-concluir'));

    expect(onRestored).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Backup restaurado')).not.toBeOnTheScreen();
  });

  it('volta da segunda confirmação sem perder o arquivo', async () => {
    const bytes = await archiveFor(singleBookTables());
    const service = createFakeBackupService();

    service.pickResult = picked('backup.zip', bytes);

    await renderWithProviders(<BackupCard />, {
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-restaurar'));
    await screen.findByText('Restaurar backup?');
    await fireEvent.press(screen.getByTestId('restore-continuar'));

    expect(screen.getByText('Restaurar agora?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Voltar'));

    expect(screen.getByText('Restaurar backup?')).toBeOnTheScreen();
  });

  it('faz round-trip completo pelo repositório em memória', async () => {
    const base = new Date('2026-01-01T12:00:00.000Z');
    const tables = emptyBackupTables();

    tables.reviewFields = [
      {
        id: 'field-1',
        name: 'O que aprendi?',
        sortOrder: 0,
        createdAt: base,
        updatedAt: base,
      },
    ];
    tables.books = tables.books.map((book, index) =>
      index === 0
        ? { ...book, coverUri: 'file:///covers/book-hobbit.jpg' }
        : book,
    );
    tables.readingSessions = [
      {
        id: 'session-1',
        bookId: 'book-hobbit',
        pages: 10,
        readAt: base,
        appliedPages: 10,
        createdAt: base,
        updatedAt: base,
      },
    ];
    tables.queueItems = [
      {
        bookId: 'book-hobbit',
        position: 0,
        note: null,
        createdAt: base,
        updatedAt: base,
      },
    ];
    tables.reviews = [
      {
        bookId: 'book-pequeno-principe',
        rating: 5,
        text: 'Bom',
        quote: null,
        extras: { 'field-1': 'Aprendi' },
        createdAt: base,
        updatedAt: base,
      },
    ];

    const covers = new Map([['book-hobbit', jpeg]]);
    const bytes = await archiveFor(tables, covers);
    const service = createFakeBackupService();
    const repository = createInMemoryBackupRepository();

    service.pickResult = picked('round-trip.zip', bytes);

    await renderWithProviders(<BackupCard />, {
      backupRepository: repository,
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-restaurar'));
    await screen.findByText('Restaurar backup?');
    await fireEvent.press(screen.getByTestId('restore-continuar'));
    await fireEvent.press(screen.getByTestId('restore-confirmar'));
    await screen.findByText('Backup restaurado');

    const parsed = parseBackup((await unpackBackupArchive(bytes)).json);
    const expected = withCoverUris(
      parsed.tables,
      new Map([['book-hobbit', 'file:///covers/book-hobbit.jpg']]),
    );

    expect(repository.exportAll()).toEqual(expected);
  });

  it('avisa quando uma capa não pôde ser gravada depois do banco', async () => {
    const bytes = await archiveFor(
      singleBookTables(),
      new Map([['book-hobbit', jpeg]]),
    );
    const service = createFakeBackupService();

    service.pickResult = picked('backup.zip', bytes);
    service.commitFailedIds = ['book-hobbit'];

    const repository = createInMemoryBackupRepository();

    await renderWithProviders(<BackupCard />, {
      backupRepository: repository,
      backupService: service,
    });

    await fireEvent.press(screen.getByTestId('backup-restaurar'));
    await screen.findByText('Restaurar backup?');
    await fireEvent.press(screen.getByTestId('restore-continuar'));
    await fireEvent.press(screen.getByTestId('restore-confirmar'));

    expect(
      await screen.findByText(
        '1 capa não pôde ser gravada; o livro ficou sem capa.',
      ),
    ).toBeOnTheScreen();
    expect(first(repository.exportAll().books).coverUri).toBeNull();
  });
});
