import { Alert, Image, View } from 'react-native';

import { AppText, Button, Card, Chip, Screen, Spine } from '@/components/ui';
import { hasCover } from '@/lib/covers';
import { sizes } from '@/theme';

import { useCoverService } from './cover-context';
import { colorForGenre, genreLabel, labelForStatus } from './genre';
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
  const covers = useCoverService();
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

  async function deleteBook() {
    // A capa sai do disco mesmo que o arquivo já não exista.
    await covers.remove(book.coverUri).catch(() => undefined);
    remove(book.id);
    onBack();
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir livro?',
      `"${book.title}" sai da estante e da fila. A capa também é apagada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: deleteBook },
      ],
    );
  }

  return (
    <Screen>
      <Button
        className="self-start"
        label="Voltar"
        onPress={onBack}
        size="sm"
        variant="ghost"
      />

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
            <Spine color={colorForGenre(book.genre)} title={book.title} />
          )}
          <View className="flex-1 gap-sm">
            <View className="flex-row flex-wrap gap-xs">
              <Chip label={genreLabel[book.genre]} />
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
        onPress={confirmDelete}
        variant="secondary"
      />
    </Screen>
  );
}
