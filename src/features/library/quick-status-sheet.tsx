import { Modal, Pressable, View } from 'react-native';

import { AppText, BookArt, Button } from '@/components/ui';
import { hasCover } from '@/lib/covers';

import { labelForStatus } from './genre';
import { StatusWheel } from './status-wheel';
import type { Book, ReadingStatus } from './types';

type QuickStatusSheetProps = {
  book: Book;
  genreColor: string;
  preview: ReadingStatus;
  onPreview: (status: ReadingStatus) => void;
  onCommit: (status: ReadingStatus) => void;
  onCancel: () => void;
};

/**
 * Folha de troca rápida de status. A prévia é só estado local: o banco só é
 * escrito quando a roda confirma (`onCommit`). Tocar fora ou em Cancelar fecha
 * sem gravar.
 */
export function QuickStatusSheet({
  book,
  genreColor,
  preview,
  onPreview,
  onCommit,
  onCancel,
}: QuickStatusSheetProps) {
  const previewBook = { ...book, status: preview };

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible>
      <View className="flex-1 justify-end bg-navy/40">
        <Pressable
          accessibilityLabel="Fechar troca de status"
          accessibilityRole="button"
          className="flex-1"
          onPress={onCancel}
          testID="quick-status-fora"
        />
        <View
          className="gap-md rounded-t-lg border-2 border-navy bg-cream p-lg"
          testID="quick-status-folha"
        >
          <View className="flex-row items-start justify-between gap-sm">
            <View className="flex-1 gap-xs">
              <AppText variant="title">Trocar status</AppText>
              <AppText numberOfLines={2} tone="muted" variant="caption">
                {book.title}
              </AppText>
            </View>
            <Button
              label="Cancelar"
              onPress={onCancel}
              size="sm"
              variant="secondary"
            />
          </View>

          <View className="flex-row items-center justify-center gap-lg">
            <BookArt
              book={previewBook}
              compact={false}
              genreColor={genreColor}
              testID="previa-status"
            />
            <View className="gap-xs">
              <AppText tone="muted" variant="label">
                Prévia
              </AppText>
              <AppText testID="previa-status-rotulo" variant="subtitle">
                {labelForStatus(preview)}
              </AppText>
              <AppText tone="muted" variant="caption">
                {hasCover(book.coverUri)
                  ? 'A capa mantém a arte; o status muda ao soltar.'
                  : 'A lombada muda de rosto ao deslizar.'}
              </AppText>
            </View>
          </View>

          <StatusWheel
            onPreview={onPreview}
            onSettle={onCommit}
            testID="roda-status"
            value={preview}
          />

          <AppText
            style={{ textAlign: 'center' }}
            tone="muted"
            variant="caption"
          >
            Deslize a roda e solte para salvar. Toque fora para cancelar.
          </AppText>
        </View>
      </View>
    </Modal>
  );
}
