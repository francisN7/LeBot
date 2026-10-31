import { useState } from 'react';
import { Image, View } from 'react-native';

import {
  AppText,
  BackButton,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Screen,
  Spine,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { hasCover } from '@/lib/covers';
import { colors, sizes } from '@/theme';

import { useCoverService } from './cover-context';
import { labelForStatus, UNKNOWN_GENRE_NAME } from './genre';
import { useBooks } from './use-books';

type BookDetailScreenProps = {
  bookId: string;
  onBack: () => void;
  onEdit: () => void;
};

/** Ficha do livro: capa/lombada, dados e as ações de editar e excluir. */
export function BookDetailScreen({
  bookId,
  onBack,
  onEdit,
}: BookDetailScreenProps) {
  const { books, remove } = useBooks();
  const { genreById } = useGenres();
  const covers = useCoverService();
  const [confirming, setConfirming] = useState(false);
  const found = books.find((item) => item.id === bookId);

  if (!found) {
    return (
      <Screen>
        <AppText variant="title">Livro não encontrado</AppText>
        <AppText tone="muted">
          Ele pode ter sido excluído. Volte para a estante e tente de novo.
        </AppText>
        <Button label="Voltar" onPress={onBack} />
      </Screen>
    );
  }

  const book = found;
  const genre = genreById.get(book.genreId);

  async function deleteBook() {
    // A capa sai do disco mesmo que o arquivo já não exista.
    await covers.remove(book.coverUri).catch(() => undefined);
    remove(book.id);
    onBack();
  }

  function confirmDelete() {
    setConfirming(false);
    void deleteBook();
  }

  return (
    <Screen>
      <BackButton onPress={onBack} />

      <View className="gap-xs">
        <AppText variant="display">{book.title}</AppText>
        <AppText tone="muted">{book.author}</AppText>
      </View>

      <Card className="gap-md">
        <View className="flex-row gap-md">
          {hasCover(book.coverUri) ? (
            <Image
              accessibilityLabel={`Capa de ${book.title}`}
              resizeMode="cover"
              source={{ uri: book.coverUri }}
              style={{ width: sizes.spine.width, height: sizes.spine.height }}
            />
          ) : (
            <Spine
              color={genre?.colorLight ?? colors.navyMuted}
              showLabel={false}
              title={book.title}
            />
          )}
          <View className="flex-1 gap-sm">
            <View className="flex-row flex-wrap gap-xs">
              <Chip label={genre?.name ?? UNKNOWN_GENRE_NAME} />
              <Chip label={labelForStatus(book.status)} selected />
            </View>
            <View className="gap-xs">
              <AppText variant="label" tone="muted">
                Páginas
              </AppText>
              <AppText variant="subtitle">
                {book.pagesRead} de {book.pages}
              </AppText>
            </View>
            <View className="gap-xs">
              <AppText variant="label" tone="muted">
                ISBN
              </AppText>
              <AppText variant="caption">
                {book.isbn ?? 'Não informado'}
              </AppText>
            </View>
          </View>
        </View>
      </Card>

      <Button label="Editar livro" onPress={onEdit} />
      <Button
        label="Excluir livro"
        onPress={() => setConfirming(true)}
        variant="secondary"
      />

      <ConfirmDialog
        cancelLabel="Cancelar"
        confirmLabel="Excluir"
        message={`"${book.title}" sai da estante e da fila. A capa também é apagada.`}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
        title="Excluir livro?"
        visible={confirming}
      />
    </Screen>
  );
}
