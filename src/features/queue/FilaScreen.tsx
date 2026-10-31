import { useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AppText, Button, Card, Chip, Screen, Spine } from '@/components/ui';
import { useGenres } from '@/features/genres';
import { UNKNOWN_GENRE_NAME, useBooks } from '@/features/library';
import { colors, sizes } from '@/theme';

import { queue } from './__fixtures__/queue';

type FilaScreenProps = {
  onOpenBook?: (bookId: string) => void;
};

export function FilaScreen({ onOpenBook }: FilaScreenProps = {}) {
  const { books } = useBooks();
  const { genreById } = useGenres();
  const booksById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );

  // A fila é fixture até a S8; livros apagados somem e não contam no total.
  const items = useMemo(
    () => queue.filter((item) => booksById.has(item.bookId)),
    [booksById],
  );

  const [nextItem, ...rest] = items;
  const nextBook = nextItem ? booksById.get(nextItem.bookId) : undefined;
  const nextGenre = nextBook ? genreById.get(nextBook.genreId) : undefined;

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Fila</AppText>
        <AppText tone="muted">
          {items.length}{' '}
          {items.length === 1
            ? 'livro esperando a sua vez'
            : 'livros esperando a sua vez'}
        </AppText>
      </View>

      {nextItem && nextBook ? (
        <Card className="gap-md">
          <AppText variant="label" tone="accent">
            Próxima parada
          </AppText>
          <View className="flex-row gap-md">
            <Spine
              color={nextGenre?.colorLight ?? colors.navyMuted}
              onPress={() => onOpenBook?.(nextBook.id)}
              showLabel={false}
              title={nextBook.title}
              width={sizes.spineCompact.width}
              height={sizes.spineCompact.height}
            />
            <View className="flex-1 justify-center gap-xs">
              <AppText variant="subtitle">{nextBook.title}</AppText>
              <AppText variant="caption" tone="muted">
                {nextBook.author} · {nextGenre?.name ?? UNKNOWN_GENRE_NAME}
              </AppText>
              <AppText variant="caption">{nextItem.note}</AppText>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Chip label={`${nextItem.plannedPages} páginas hoje`} />
            <Button
              label="Começar"
              size="sm"
              onPress={() =>
                Alert.alert('Em breve', 'A sessão de leitura chega na S5.')
              }
            />
          </View>
        </Card>
      ) : null}

      <View className="gap-sm">
        <AppText variant="subtitle">Depois</AppText>
        {rest.map((item, index) => {
          const book = booksById.get(item.bookId);
          if (!book) {
            return null;
          }

          return (
            <Pressable
              accessibilityLabel={`Abrir ${book.title}`}
              accessibilityRole="button"
              className="active:opacity-80"
              key={item.bookId}
              onPress={() => onOpenBook?.(book.id)}
            >
              <Card className="flex-row items-center gap-md">
                <AppText variant="title">{index + 2}</AppText>
                <View className="flex-1 gap-xs">
                  <AppText variant="bodyStrong">{book.title}</AppText>
                  <AppText variant="caption" tone="muted">
                    {item.note}
                  </AppText>
                </View>
                <Chip label={`${item.plannedPages} pág.`} />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
