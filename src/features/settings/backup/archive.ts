import {
  type AsyncZippable,
  strFromU8,
  strToU8,
  type Unzipped,
  unzip,
  zip,
} from 'fflate';

import { coverFileName } from '@/lib/covers';

import { BACKUP_ID_PATTERN } from './types';

export const BACKUP_ENTRY = 'backup.json';
export const COVERS_FOLDER = 'covers';

export const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024;
export const MAX_UNCOMPRESSED_BYTES = 256 * 1024 * 1024;
export const MAX_JSON_BYTES = 32 * 1024 * 1024;
export const MAX_COVER_BYTES = 20 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 10_000;

export class BackupArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupArchiveError';
  }
}

function zipAsync(files: AsyncZippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(files, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function unzipAsync(bytes: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(bytes, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function assertCoverId(bookId: string): void {
  if (!BACKUP_ID_PATTERN.test(bookId)) {
    throw new BackupArchiveError(
      'O backup tem uma capa com um identificador inválido.',
    );
  }
}

/** Monta o .zip: `backup.json` na raiz e uma capa por livro em `covers/`. */
export async function packBackupArchive(
  json: string,
  covers: ReadonlyMap<string, Uint8Array>,
): Promise<Uint8Array> {
  const files: AsyncZippable = {
    [BACKUP_ENTRY]: [strToU8(json), { level: 6 }],
  };

  for (const [bookId, bytes] of covers) {
    assertCoverId(bookId);
    files[`${COVERS_FOLDER}/${coverFileName(bookId)}`] = [bytes, { level: 0 }];
  }

  const archive = await zipAsync(files);

  if (archive.length > MAX_ARCHIVE_BYTES) {
    throw new BackupArchiveError(
      'O backup ficou grande demais para este aparelho restaurar.',
    );
  }

  return archive;
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function coverIdFromPath(path: string): string | null {
  const prefix = `${COVERS_FOLDER}/`;

  if (!path.startsWith(prefix) || !path.endsWith('.jpg')) {
    return null;
  }

  const bookId = path.slice(prefix.length, -'.jpg'.length);

  return BACKUP_ID_PATTERN.test(bookId) ? bookId : null;
}

/** Abre o .zip e separa o JSON das capas, sem confiar no conteúdo. */
export async function unpackBackupArchive(bytes: Uint8Array): Promise<{
  json: string;
  covers: Map<string, Uint8Array>;
}> {
  if (bytes.length === 0) {
    throw new BackupArchiveError('O arquivo está vazio.');
  }

  if (bytes.length > MAX_ARCHIVE_BYTES) {
    throw new BackupArchiveError(
      'O arquivo é grande demais para restaurar neste aparelho.',
    );
  }

  if (!isZip(bytes)) {
    throw new BackupArchiveError(
      'O arquivo escolhido não é um backup do LêBot (.zip).',
    );
  }

  let files: Unzipped;

  try {
    files = await unzipAsync(bytes);
  } catch {
    throw new BackupArchiveError(
      'Não foi possível abrir o arquivo .zip. Ele pode estar corrompido.',
    );
  }

  const paths = Object.keys(files);

  if (paths.length > MAX_ARCHIVE_ENTRIES) {
    throw new BackupArchiveError('O backup tem arquivos demais.');
  }

  const jsonBytes = files[BACKUP_ENTRY];

  if (!jsonBytes) {
    throw new BackupArchiveError(
      'O .zip não tem o arquivo backup.json na raiz.',
    );
  }

  if (jsonBytes.length > MAX_JSON_BYTES) {
    throw new BackupArchiveError('O backup.json é grande demais.');
  }

  let total = jsonBytes.length;
  const covers = new Map<string, Uint8Array>();

  for (const path of paths) {
    if (path === BACKUP_ENTRY) {
      continue;
    }

    const bookId = coverIdFromPath(path);

    if (!bookId) {
      throw new BackupArchiveError(
        `O backup tem um arquivo inesperado: ${path}.`,
      );
    }

    const cover = files[path];

    if (!cover) {
      continue;
    }

    if (cover.length > MAX_COVER_BYTES) {
      throw new BackupArchiveError(
        `A capa de "${bookId}" é grande demais para restaurar.`,
      );
    }

    total += cover.length;

    if (total > MAX_UNCOMPRESSED_BYTES) {
      throw new BackupArchiveError(
        'O conteúdo do backup é grande demais para restaurar neste aparelho.',
      );
    }

    covers.set(bookId, cover);
  }

  return { json: strFromU8(jsonBytes), covers };
}
