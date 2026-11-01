import { Modal, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';

import { formatBackupDate } from './backup/format';
import { backupCountsLabel } from './backup/labels';
import type {
  BackupCounts,
  BackupRestoreResult,
  PickedBackup,
} from './backup/types';
import type { BackupBusy } from './backup/use-backup';

export type RestoreStep = 'first' | 'second' | 'success' | null;

type RestoreBackupDialogProps = {
  step: RestoreStep;
  picked: PickedBackup | null;
  current: BackupCounts | null;
  result: BackupRestoreResult | null;
  busy: BackupBusy;
  copyMessage: string | null;
  error: string | null;
  onCancel: () => void;
  onBack: () => void;
  onContinue: () => void;
  onRestore: () => void;
  onExportCopy: () => void;
  onDone: () => void;
};

function FirstStep({
  picked,
  current,
  busy,
  copyMessage,
  error,
  onCancel,
  onContinue,
  onExportCopy,
}: {
  picked: PickedBackup;
  current: BackupCounts;
  busy: BackupBusy;
  copyMessage: string | null;
  error: string | null;
  onCancel: () => void;
  onContinue: () => void;
  onExportCopy: () => void;
}) {
  return (
    <>
      <AppText variant="subtitle">Restaurar backup?</AppText>
      <AppText tone="muted">{`Arquivo: ${picked.fileName}`}</AppText>
      <AppText tone="muted">
        {`Exportado em ${formatBackupDate(picked.exportedAt)} pelo LêBot ${picked.appVersion}.`}
      </AppText>
      <AppText>{`No arquivo: ${backupCountsLabel(picked.counts)}.`}</AppText>
      <AppText>{`No aparelho agora: ${backupCountsLabel(current)}.`}</AppText>
      {picked.counts.books === 0 ? (
        <AppText tone="accent">
          O backup não tem nenhum livro; restaurar vai esvaziar a estante.
        </AppText>
      ) : null}
      <AppText tone="muted">
        Restaurar substitui todos os dados atuais e não pode ser desfeito. O
        arquivo é pessoal: guarde com cuidado.
      </AppText>
      {copyMessage ? (
        <AppText tone="muted" variant="caption">
          {copyMessage}
        </AppText>
      ) : null}
      {error ? (
        <AppText tone="accent" variant="caption">
          {error}
        </AppText>
      ) : null}
      <View className="flex-row flex-wrap justify-end gap-sm">
        <Button
          disabled={busy !== null}
          label="Cancelar"
          onPress={onCancel}
          size="sm"
          variant="secondary"
        />
        <Button
          disabled={busy !== null}
          label={
            busy === 'export' ? 'Gerando cópia...' : 'Exportar cópia atual'
          }
          onPress={onExportCopy}
          size="sm"
          testID="restore-copia"
          variant="secondary"
        />
        <Button
          disabled={busy !== null}
          label="Continuar"
          onPress={onContinue}
          size="sm"
          testID="restore-continuar"
        />
      </View>
    </>
  );
}

function SecondStep({
  picked,
  current,
  busy,
  onBack,
  onRestore,
}: {
  picked: PickedBackup;
  current: BackupCounts;
  busy: BackupBusy;
  onBack: () => void;
  onRestore: () => void;
}) {
  return (
    <>
      <AppText variant="subtitle">Restaurar agora?</AppText>
      <AppText>
        {`Isso apaga ${backupCountsLabel(current)} e coloca ${backupCountsLabel(picked.counts)} no lugar.`}
      </AppText>
      <AppText tone="accent">
        A restauração não pode ser desfeita. As capas do arquivo também voltam.
      </AppText>
      <View className="flex-row flex-wrap justify-end gap-sm">
        <Button
          disabled={busy !== null}
          label="Voltar"
          onPress={onBack}
          size="sm"
          variant="secondary"
        />
        <Button
          disabled={busy !== null}
          label={busy === 'restore' ? 'Restaurando...' : 'Restaurar'}
          onPress={onRestore}
          size="sm"
          testID="restore-confirmar"
          variant="danger"
        />
      </View>
    </>
  );
}

function SuccessStep({
  result,
  onDone,
}: {
  result: BackupRestoreResult;
  onDone: () => void;
}) {
  return (
    <>
      <AppText variant="subtitle">Backup restaurado</AppText>
      <AppText>{`${backupCountsLabel(result.counts)} voltaram.`}</AppText>
      <AppText tone="muted">
        As capas que estavam no arquivo também foram restauradas.
      </AppText>
      {result.failedCovers > 0 ? (
        <AppText tone="accent">
          {result.failedCovers === 1
            ? '1 capa não pôde ser gravada; o livro ficou sem capa.'
            : `${result.failedCovers} capas não puderam ser gravadas; esses livros ficaram sem capa.`}
        </AppText>
      ) : null}
      <View className="flex-row justify-end">
        <Button
          label="Ver estante"
          onPress={onDone}
          size="sm"
          testID="restore-concluir"
        />
      </View>
    </>
  );
}

/** Confirmação dupla da importação e o aviso de sucesso. */
export function RestoreBackupDialog({
  step,
  picked,
  current,
  result,
  busy,
  copyMessage,
  error,
  onCancel,
  onBack,
  onContinue,
  onRestore,
  onExportCopy,
  onDone,
}: RestoreBackupDialogProps) {
  if (step === null) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={
        step === 'success' ? onDone : step === 'second' ? onBack : onCancel
      }
      transparent
      visible
    >
      <View className="flex-1 items-center justify-center bg-navy/40 p-lg">
        <Card className="w-full gap-md" testID="restore-dialog">
          {step === 'first' && picked && current ? (
            <FirstStep
              busy={busy}
              copyMessage={copyMessage}
              current={current}
              error={error}
              onCancel={onCancel}
              onContinue={onContinue}
              onExportCopy={onExportCopy}
              picked={picked}
            />
          ) : null}
          {step === 'second' && picked && current ? (
            <SecondStep
              busy={busy}
              current={current}
              onBack={onBack}
              onRestore={onRestore}
              picked={picked}
            />
          ) : null}
          {step === 'success' && result ? (
            <SuccessStep onDone={onDone} result={result} />
          ) : null}
        </Card>
      </View>
    </Modal>
  );
}
