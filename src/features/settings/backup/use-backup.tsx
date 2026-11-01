import Constants from 'expo-constants';
import { useCallback, useMemo, useState } from 'react';

import type { BackupCounts } from '@/db/repositories';

import { useSettings } from '../use-settings';
import { packBackupArchive, unpackBackupArchive } from './archive';
import { useBackupRepository, useBackupService } from './backup-context';
import {
  backupFileName,
  countBackup,
  parseBackup,
  serializeBackup,
  validateBackup,
  withCoverUris,
} from './format';
import type { StagedCovers } from './service';
import {
  type BackupRestoreResult,
  MissingCoverFilesError,
  type PickedBackup,
} from './types';

export type BackupBusy = 'export' | 'pick' | 'restore' | null;

const appVersion = Constants.expoConfig?.version ?? '0.1.0';

function quotedTitles(titles: readonly string[]): string {
  const shown = titles
    .slice(0, 3)
    .map((title) => `"${title}"`)
    .join(', ');
  const rest = titles.length > 3 ? ` e mais ${titles.length - 3}` : '';

  return `${shown}${rest}`;
}

function messageOf(error: unknown): string {
  if (error instanceof MissingCoverFilesError) {
    return `Estas capas não estão mais no aparelho: ${quotedTitles(error.titles)}. Remova ou troque a capa no livro antes de exportar.`;
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível completar o backup.';
}

/**
 * Orquestra o backup: lê o banco, junta as capas, valida e restaura. A parte
 * nativa fica no `BackupService`; o formato, no serializador puro.
 */
export function useBackup() {
  const repository = useBackupRepository();
  const service = useBackupService();
  const { values, setValue } = useSettings();
  const [busy, setBusy] = useState<BackupBusy>(null);
  const [error, setError] = useState<string | null>(null);

  const lastExportedAt = useMemo(() => {
    const raw = values['backup.last_exported_at'];

    if (!raw) {
      return null;
    }

    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [values]);

  const counts = useCallback(
    (): BackupCounts => repository.counts(),
    [repository],
  );

  const exportBackup = useCallback(async () => {
    setBusy('export');
    setError(null);

    try {
      const tables = repository.exportAll();
      const covers = await service.readCovers(
        tables.books.map(({ id, title, coverUri }) => ({
          id,
          title,
          coverUri,
        })),
      );
      const exportedAt = new Date();
      const json = serializeBackup(
        tables,
        { exportedAt, appVersion },
        new Set(covers.keys()),
      );
      const bytes = await packBackupArchive(json, covers);
      const fileName = backupFileName(exportedAt);
      const saved = await service.saveArchive(fileName, bytes);

      if (saved.status === 'canceled') {
        return null;
      }

      try {
        setValue('backup.last_exported_at', exportedAt.toISOString());
      } catch {
        // A data é conveniência; o arquivo já foi salvo.
      }

      return { fileName: saved.fileName, counts: countBackup(tables) };
    } catch (cause) {
      setError(messageOf(cause));
      return null;
    } finally {
      setBusy(null);
    }
  }, [repository, service, setValue]);

  const pickBackup = useCallback(async (): Promise<PickedBackup | null> => {
    setBusy('pick');
    setError(null);

    try {
      const picked = await service.pickArchive();

      if (picked.canceled) {
        return null;
      }

      const { json, covers } = await unpackBackupArchive(picked.bytes);
      const parsed = parseBackup(json);

      validateBackup(parsed.tables, new Set(covers.keys()));

      return {
        fileName: picked.fileName,
        tables: parsed.tables,
        counts: countBackup(parsed.tables),
        exportedAt: parsed.exportedAt,
        appVersion: parsed.appVersion,
        covers,
      };
    } catch (cause) {
      setError(messageOf(cause));
      return null;
    } finally {
      setBusy(null);
    }
  }, [service]);

  const restoreBackup = useCallback(
    async (picked: PickedBackup): Promise<BackupRestoreResult | null> => {
      setBusy('restore');
      setError(null);

      let staged: StagedCovers | null = null;
      let replaced = false;

      try {
        staged = await service.stageCovers(picked.covers);
        const tables = withCoverUris(picked.tables, staged.finalUriByBook);

        repository.replaceAll(tables);
        replaced = true;

        let failedBookIds: string[] = [];

        try {
          const commit = await service.commitCovers(staged, [
            ...picked.covers.keys(),
          ]);
          failedBookIds = commit.failedBookIds;
        } catch {
          failedBookIds = [...picked.covers.keys()];
        }

        if (failedBookIds.length > 0) {
          repository.clearCoverUris(failedBookIds);
        }

        return {
          counts: picked.counts,
          failedCovers: failedBookIds.length,
        };
      } catch (cause) {
        if (staged && !replaced) {
          await service.discardCovers(staged);
        }

        setError(messageOf(cause));
        return null;
      } finally {
        setBusy(null);
      }
    },
    [repository, service],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    busy,
    clearError,
    counts,
    error,
    exportBackup,
    lastExportedAt,
    pickBackup,
    restoreBackup,
  };
}
