import { Modal, View } from 'react-native';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmação no visual do app, no lugar do `Alert` do sistema. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-navy/40 p-lg">
        <Card className="w-full gap-md" testID="confirm-dialog">
          <AppText variant="subtitle">{title}</AppText>
          {message ? <AppText tone="muted">{message}</AppText> : null}
          <View className="flex-row justify-end gap-sm">
            <Button
              label={cancelLabel}
              onPress={onCancel}
              size="sm"
              variant="secondary"
            />
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              size="sm"
              variant="danger"
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
