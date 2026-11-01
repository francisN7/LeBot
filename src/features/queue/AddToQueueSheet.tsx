import { Modal, Pressable, ScrollView, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { labelForStatus, UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';

type AddToQueueSheetProps = {
  visible: boolean;
  /** Livros que ainda podem entrar: não concluídos e fora da ordem. */
  books: readonly Book[];
  genreNameById: ReadonlyMap<string, { name: string }>;
  onAdd: (bookId: string) => void;
  onClose: () => void;
};

/** Seletor da própria Ordem: escolhe um livro da estante para o fim da fila. */
export function AddToQueueSheet({
  visible,
  books,
  genreNameById,
  onAdd,
  onClose,
}: AddToQueueSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-navy/40">
        <Card className="max-h-[85%] gap-md rounded-b-none" testID="add-queue">
          <View className="gap-xs">
            <AppText variant="title">Adicionar à ordem</AppText>
            <AppText tone="muted" variant="caption">
              Escolha o que vem depois do livro atual. Livros concluídos ficam
              de fora; pausados entram, mas não são sugeridos no plano.
            </AppText>
          </View>

          {books.length === 0 ? (
            <AppText tone="muted">
              Todos os seus livros já estão na ordem.
            </AppText>
          ) : (
            <ScrollView
              contentContainerClassName="gap-xs"
              showsVerticalScrollIndicator={false}
            >
              {books.map((book) => {
                const genre = genreNameById.get(book.genreId);

                return (
                  <Pressable
                    accessibilityLabel={`Adicionar ${book.title}`}
                    accessibilityRole="button"
                    className="flex-row items-center gap-md rounded-md border-2 border-navy bg-cream p-md active:opacity-80"
                    key={book.id}
                    onPress={() => onAdd(book.id)}
                  >
                    <View className="flex-1 gap-xs">
                      <AppText numberOfLines={1} variant="bodyStrong">
                        {book.title}
                      </AppText>
                      <AppText numberOfLines={1} tone="muted" variant="caption">
                        {`${book.author} · ${genre?.name ?? UNKNOWN_GENRE_NAME}`}
                      </AppText>
                      <AppText tone="muted" variant="caption">
                        {labelForStatus(book.status)}
                      </AppText>
                    </View>
                    <AppText tone="accent" variant="label">
                      Adicionar
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Button label="Fechar" onPress={onClose} variant="secondary" />
        </Card>
      </View>
    </Modal>
  );
}
