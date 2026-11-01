import type {
  BackupCounts,
  BackupRepository,
  BackupTables,
} from '@/db/repositories';
import { seedSettings } from '@/db/seed';
import type {
  BackupService,
  CoverSource,
  PickArchiveResult,
  StagedCovers,
} from '@/features/settings/backup/service';
import { MissingCoverFilesError } from '@/features/settings/backup/types';
import { coverFileName } from '@/lib/covers';

import { testBookRows, testGenreRows } from './repositories';

function cloneTables(tables: BackupTables): BackupTables {
  return {
    genres: tables.genres.map((row) => ({ ...row })),
    reviewFields: tables.reviewFields.map((row) => ({ ...row })),
    books: tables.books.map((row) => ({ ...row })),
    readingSessions: tables.readingSessions.map((row) => ({ ...row })),
    queueItems: tables.queueItems.map((row) => ({ ...row })),
    reviews: tables.reviews.map((row) => ({
      ...row,
      extras: { ...row.extras },
    })),
    settings: tables.settings.map((row) => ({ ...row })),
  };
}

export function emptyBackupTables(): BackupTables {
  return {
    genres: testGenreRows.map((row) => ({ ...row })),
    reviewFields: [],
    books: testBookRows.map((row) => ({ ...row })),
    readingSessions: [],
    queueItems: [],
    reviews: [],
    settings: Object.entries(seedSettings).map(([key, value]) => ({
      key,
      value,
    })),
  };
}

function countsOf(tables: BackupTables): BackupCounts {
  return {
    books: tables.books.length,
    sessions: tables.readingSessions.length,
    reviews: tables.reviews.length,
    genres: tables.genres.length,
    reviewFields: tables.reviewFields.length,
    queueItems: tables.queueItems.length,
    settings: tables.settings.length,
  };
}

/** Repositório em memória do backup, para telas sem abrir SQLite. */
export function createInMemoryBackupRepository(
  initial: BackupTables = emptyBackupTables(),
): BackupRepository {
  let tables = cloneTables(initial);

  return {
    exportAll() {
      return cloneTables(tables);
    },
    counts() {
      return countsOf(tables);
    },
    replaceAll(next) {
      tables = cloneTables(next);
    },
    clearCoverUris(bookIds) {
      const ids = new Set(bookIds);
      tables = {
        ...tables,
        books: tables.books.map((book) =>
          ids.has(book.id) ? { ...book, coverUri: null } : book,
        ),
      };
    },
  };
}

export type FakeBackupService = BackupService & {
  shares: { fileName: string; bytes: Uint8Array }[];
  committed: string[][];
  discarded: number;
  /** Configura o que o seletor devolve; `null` simula cancelamento. */
  pickResult: PickArchiveResult | null;
  /** Títulos que devem falhar como "capa sumida" no export. */
  missingCovers: string[];
  /** Se definido, o compartilhamento falha com esta mensagem. */
  shareError: string | null;
  /** Ids que falham ao mover a capa depois do banco. */
  commitFailedIds: string[];
};

/**
 * Serviço de backup em memória: o seletor devolve o `pickResult`, as capas
 * viram bytes fixos e o compartilhamento só registra o que seria enviado.
 */
export function createFakeBackupService(
  options: Partial<FakeBackupService> = {},
): FakeBackupService {
  const state = {
    shares: [] as { fileName: string; bytes: Uint8Array }[],
    committed: [] as string[][],
    discarded: 0,
    pickResult: null as PickArchiveResult | null,
    missingCovers: [] as string[],
    shareError: null as string | null,
    commitFailedIds: [] as string[],
    ...options,
  };

  const service: FakeBackupService = {
    get shares() {
      return state.shares;
    },
    get committed() {
      return state.committed;
    },
    get discarded() {
      return state.discarded;
    },
    get pickResult() {
      return state.pickResult;
    },
    set pickResult(value) {
      state.pickResult = value;
    },
    get missingCovers() {
      return state.missingCovers;
    },
    set missingCovers(value) {
      state.missingCovers = value;
    },
    get shareError() {
      return state.shareError;
    },
    set shareError(value) {
      state.shareError = value;
    },
    get commitFailedIds() {
      return state.commitFailedIds;
    },
    set commitFailedIds(value) {
      state.commitFailedIds = value;
    },

    async readCovers(books: readonly CoverSource[]) {
      const missing = books
        .filter((book) => state.missingCovers.includes(book.title))
        .map((book) => book.title);

      if (missing.length > 0) {
        throw new MissingCoverFilesError(missing);
      }

      const covers = new Map<string, Uint8Array>();

      for (const book of books) {
        if (book.coverUri) {
          covers.set(book.id, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
        }
      }

      return covers;
    },

    async shareArchive(fileName, bytes) {
      if (state.shareError) {
        throw new Error(state.shareError);
      }

      state.shares.push({ fileName, bytes });
    },

    async pickArchive() {
      return state.pickResult ?? { canceled: true };
    },

    async stageCovers(covers) {
      return {
        token: 'fake',
        finalUriByBook: new Map(
          [...covers.keys()].map((bookId) => [
            bookId,
            `file:///covers/${coverFileName(bookId)}`,
          ]),
        ),
      } satisfies StagedCovers;
    },

    async commitCovers(_staged, coverBookIds) {
      state.committed.push([...coverBookIds]);
      return {
        failedBookIds: coverBookIds.filter((bookId) =>
          state.commitFailedIds.includes(bookId),
        ),
      };
    },

    async discardCovers() {
      state.discarded += 1;
    },
  };

  return service;
}
