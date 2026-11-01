import type { BackupCounts, BackupTables } from '@/db/repositories/backup';

export type { BackupCounts, BackupTables } from '@/db/repositories/backup';

export const BACKUP_FORMAT_VERSION = 1;

/** Ids seguros para virar nome de arquivo dentro do backup. */
export const BACKUP_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export type BackupMeta = {
  exportedAt: Date;
  appVersion: string;
};

/** Backup já lido e validado, pronto para a confirmação e a restauração. */
export type PickedBackup = {
  fileName: string;
  tables: BackupTables;
  counts: BackupCounts;
  exportedAt: Date;
  appVersion: string;
  covers: Map<string, Uint8Array>;
};

export type BackupRestoreResult = {
  counts: BackupCounts;
  failedCovers: number;
};

export class MissingCoverFilesError extends Error {
  readonly titles: string[];

  constructor(titles: string[]) {
    super('Há capas que não estão mais no aparelho.');
    this.name = 'MissingCoverFilesError';
    this.titles = titles;
  }
}
