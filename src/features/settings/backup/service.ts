import {
  Directory,
  File,
  Paths,
  type PickSingleFileResult,
} from 'expo-file-system';

import { COVERS_DIRECTORY, coverFileName } from '@/lib/covers';

import {
  BackupArchiveError,
  MAX_ARCHIVE_BYTES,
  MAX_COVER_BYTES,
} from './archive';
import { MissingCoverFilesError } from './types';

export type CoverSource = {
  id: string;
  title: string;
  coverUri: string | null;
};

export type StagedCovers = {
  /** Nome da pasta temporária dentro de `Paths.cache`. */
  token: string;
  finalUriByBook: Map<string, string>;
};

export type PickArchiveResult =
  | { canceled: true }
  | { canceled: false; fileName: string; bytes: Uint8Array };

export type SaveArchiveResult =
  | { status: 'canceled' }
  | { status: 'saved'; fileName: string };

export { MissingCoverFilesError };

export type BackupService = {
  /** Lê os arquivos de capa; falha se algum caminho não existir. */
  readCovers(books: readonly CoverSource[]): Promise<Map<string, Uint8Array>>;
  /** Escolhe a pasta e grava o .zip nela. */
  saveArchive(fileName: string, bytes: Uint8Array): Promise<SaveArchiveResult>;
  /** Abre o seletor de arquivos e devolve os bytes do .zip. */
  pickArchive(): Promise<PickArchiveResult>;
  /** Prepara as capas numa pasta temporária, antes de tocar no banco. */
  stageCovers(covers: ReadonlyMap<string, Uint8Array>): Promise<StagedCovers>;
  /** Move as capas preparadas para `covers/` e limpa arquivos antigos. */
  commitCovers(
    staged: StagedCovers,
    coverBookIds: readonly string[],
  ): Promise<{ failedBookIds: string[] }>;
  /** Descarta a pasta temporária depois de uma falha. */
  discardCovers(staged: StagedCovers): Promise<void>;
};

function coversDirectory(): Directory {
  return new Directory(Paths.document, COVERS_DIRECTORY);
}

function ensureCoversDirectory(): Directory {
  const directory = coversDirectory();

  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }

  return directory;
}

function isPickerCanceled(error: unknown): boolean {
  return error instanceof Error && /cancel/i.test(error.message);
}

function withTimeSuffix(fileName: string): string {
  const time = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
  return fileName.replace(/\.zip$/i, `-${time}.zip`);
}

/**
 * Camada nativa do backup: arquivos, pasta e seletor. A regra de formato fica
 * em `format.ts`/`archive.ts`; aqui só se toca no aparelho.
 */
export function createDeviceBackupService(): BackupService {
  return {
    async readCovers(books) {
      const covers = new Map<string, Uint8Array>();
      const missing: string[] = [];

      for (const book of books) {
        if (!book.coverUri) {
          continue;
        }

        let file: File | null = null;

        try {
          file = new File(book.coverUri);
        } catch {
          missing.push(book.title);
          continue;
        }

        if (!file) {
          missing.push(book.title);
          continue;
        }

        if (!file.exists || file.size === 0) {
          missing.push(book.title);
          continue;
        }

        if (file.size > MAX_COVER_BYTES) {
          throw new Error(
            `A capa de "${book.title}" é grande demais para o backup.`,
          );
        }

        try {
          covers.set(book.id, await file.bytes());
        } catch {
          missing.push(book.title);
        }
      }

      if (missing.length > 0) {
        throw new MissingCoverFilesError(missing);
      }

      return covers;
    },

    async saveArchive(fileName, bytes) {
      let directory: Directory;

      try {
        directory = await Directory.pickDirectoryAsync();
      } catch (error) {
        if (isPickerCanceled(error)) {
          return { status: 'canceled' };
        }

        throw new Error(
          'Não foi possível abrir a seleção de pasta neste aparelho.',
        );
      }

      let file: File;

      try {
        file = directory.createFile(fileName, 'application/zip');
      } catch {
        // Um backup anterior com o mesmo nome pode bloquear a criação. Não
        // apaga o que existe: tenta um nome com a hora para não perder nada.
        try {
          file = directory.createFile(
            withTimeSuffix(fileName),
            'application/zip',
          );
        } catch {
          throw new Error(
            'Não foi possível criar o backup na pasta escolhida.',
          );
        }
      }

      try {
        await file.write(bytes);
      } catch {
        throw new Error('Não foi possível salvar o backup na pasta escolhida.');
      }

      return { status: 'saved', fileName: file.name || fileName };
    },

    async pickArchive() {
      const result: PickSingleFileResult = await File.pickFileAsync({
        mimeTypes: ['*/*'],
      }).catch(() => {
        throw new Error(
          'Não foi possível abrir o seletor de arquivos neste aparelho.',
        );
      });

      if (result.canceled) {
        return { canceled: true };
      }

      const file = result.result;

      if (file.size > MAX_ARCHIVE_BYTES) {
        throw new BackupArchiveError(
          'O arquivo é grande demais para restaurar neste aparelho.',
        );
      }

      let bytes: Uint8Array;

      try {
        bytes = await file.bytes();
      } catch {
        throw new Error('Não foi possível ler o arquivo escolhido.');
      }

      if (bytes.length > MAX_ARCHIVE_BYTES) {
        throw new BackupArchiveError(
          'O arquivo é grande demais para restaurar neste aparelho.',
        );
      }

      return {
        canceled: false,
        fileName: file.name || 'backup.zip',
        bytes,
      };
    },

    async stageCovers(covers) {
      const token = `lebot-restore-${Date.now().toString(36)}`;
      const directory = new Directory(Paths.cache, token);
      const finalUriByBook = new Map<string, string>();

      try {
        directory.create({ intermediates: true, idempotent: true });

        for (const [bookId, bytes] of covers) {
          const staged = new File(directory, coverFileName(bookId));
          staged.create({ overwrite: true });
          await staged.write(bytes);
          finalUriByBook.set(
            bookId,
            new File(coversDirectory(), coverFileName(bookId)).uri,
          );
        }
      } catch (error) {
        try {
          directory.delete();
        } catch {
          // A pasta temporária fica para o sistema limpar.
        }

        throw error;
      }

      return { token, finalUriByBook };
    },

    async commitCovers(staged, coverBookIds) {
      const directory = ensureCoversDirectory();
      const failedBookIds: string[] = [];
      const moved = new Set<string>();

      for (const bookId of coverBookIds) {
        try {
          const source = new File(
            new Directory(Paths.cache, staged.token),
            coverFileName(bookId),
          );
          const destination = new File(directory, coverFileName(bookId));

          await source.move(destination, { overwrite: true });
          moved.add(bookId);
        } catch {
          failedBookIds.push(bookId);
        }
      }

      const keep = new Set([...moved].map((bookId) => coverFileName(bookId)));

      try {
        for (const entry of directory.list()) {
          if (entry instanceof File && !keep.has(entry.name)) {
            entry.delete();
          }
        }
      } catch {
        // Limpeza é conveniência; a restauração já terminou.
      }

      try {
        new Directory(Paths.cache, staged.token).delete();
      } catch {
        // Cache limpa sozinho.
      }

      return { failedBookIds };
    },

    async discardCovers(staged) {
      try {
        new Directory(Paths.cache, staged.token).delete();
      } catch {
        // Cache limpa sozinho.
      }
    },
  };
}
