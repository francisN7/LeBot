import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Chip } from '@/components/ui';

import { formatBackupDate } from './backup/format';
import type {
  BackupCounts,
  BackupRestoreResult,
  PickedBackup,
} from './backup/types';
import { useBackup } from './backup/use-backup';
import { RestoreBackupDialog, type RestoreStep } from './RestoreBackupDialog';

type BackupCardProps = {
  /** Chamado quando o dono fecha o aviso de sucesso; remonta o app. */
  onRestored?: () => void;
};

export function BackupCard({ onRestored }: BackupCardProps = {}) {
  const {
    busy,
    clearError,
    counts,
    error,
    exportBackup,
    lastExportedAt,
    pickBackup,
    restoreBackup,
  } = useBackup();
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<RestoreStep>(null);
  const [picked, setPicked] = useState<PickedBackup | null>(null);
  const [current, setCurrent] = useState<BackupCounts | null>(null);
  const [result, setResult] = useState<BackupRestoreResult | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  function resetDialog() {
    setStep(null);
    setPicked(null);
    setCurrent(null);
    setResult(null);
    setCopyMessage(null);
    clearError();
  }

  async function handleExport() {
    setMessage(null);
    clearError();
    const exported = await exportBackup();

    if (exported) {
      setMessage(`Backup gerado: ${exported.fileName}.`);
    }
  }

  async function handlePick() {
    setMessage(null);
    setPicked(null);
    setCurrent(null);
    setResult(null);
    setCopyMessage(null);
    clearError();
    const next = await pickBackup();

    if (!next) {
      return;
    }

    setPicked(next);
    setCurrent(counts());
    setStep('first');
  }

  async function handleExportCopy() {
    setCopyMessage(null);
    clearError();
    const exported = await exportBackup();

    if (exported) {
      setCopyMessage('Cópia do estado atual gerada.');
    }
  }

  async function handleRestore() {
    if (!picked) {
      return;
    }

    const restored = await restoreBackup(picked);

    if (!restored) {
      setStep(null);
      return;
    }

    setResult(restored);
    setStep('success');
  }

  function handleDone() {
    resetDialog();
    onRestored?.();
  }

  const busyLabel =
    busy === 'export'
      ? 'Preparando o backup...'
      : busy === 'pick'
        ? 'Lendo o arquivo...'
        : busy === 'restore'
          ? 'Restaurando...'
          : null;

  return (
    <Card className="gap-sm" testID="backup">
      <View className="flex-row items-center justify-between gap-sm">
        <AppText variant="bodyStrong">Backup</AppText>
        <Chip label="Local" />
      </View>
      <AppText tone="muted" variant="caption">
        Um arquivo .zip com seus livros, histórico, resenhas e capas. Ele é
        pessoal: fica só com você.
      </AppText>
      <AppText tone="muted" variant="caption">
        {lastExportedAt
          ? `Último backup: ${formatBackupDate(lastExportedAt)}.`
          : 'Nenhum backup ainda.'}
      </AppText>

      <View className="gap-xs">
        <Button
          disabled={busy !== null}
          label="Exportar backup"
          onPress={handleExport}
          testID="backup-exportar"
        />
        <Button
          disabled={busy !== null}
          label="Restaurar backup"
          onPress={handlePick}
          testID="backup-restaurar"
          variant="secondary"
        />
      </View>

      {busyLabel ? (
        <AppText tone="muted" variant="caption">
          {busyLabel}
        </AppText>
      ) : null}
      {message ? (
        <AppText tone="muted" variant="caption">
          {message}
        </AppText>
      ) : null}
      {error && step === null ? (
        <AppText tone="accent" variant="caption">
          {error}
        </AppText>
      ) : null}

      <RestoreBackupDialog
        busy={busy}
        copyMessage={copyMessage}
        current={current}
        error={error}
        onBack={() => {
          setCopyMessage(null);
          clearError();
          setStep('first');
        }}
        onCancel={resetDialog}
        onContinue={() => setStep('second')}
        onDone={handleDone}
        onExportCopy={handleExportCopy}
        onRestore={handleRestore}
        picked={picked}
        result={result}
        step={step}
      />
    </Card>
  );
}
