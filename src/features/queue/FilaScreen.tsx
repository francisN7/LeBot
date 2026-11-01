import { useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';

import {
  AppText,
  BookCover,
  Button,
  Card,
  Chip,
  Screen,
  Spine,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';
import { useBooks } from '@/features/library/use-books';
import { hasCover } from '@/lib/covers';
import { colors, sizes } from '@/theme';

import { queue } from './__fixtures__/queue';

type FilaScreenProps = {
  onOpenBook?: (bookId: string) => void;
};

type QueueBookArtProps = {
  book: Book;
  genreColor: string;
  onPress?: () => void;
};

/**
 * Capa real quando existe, lombada quando não. Compacta (72×104) porque divide
 * a linha com título, nota e páginas. A fita do gênero vem da própria capa.
 */
function QueueBookArt({ book, genreColor, onPress }: QueueBookArtProps) {
  const { height, width } = sizes.spineCompact;

  if (hasCover(book.coverUri)) {
    return (
      <BookCover
        genreColor={genreColor}
        height={height}
        onPress={onPress}
        status={book.status}
        title={book.title}
        uri={book.coverUri}
        width={width}
      />
    );
  }

  return (
    <Spine
      color={genreColor}
      height={height}
      onPress={onPress}
      showLabel={false}
      status={book.status}
      title={book.title}
      width={width}
    />
  );
}

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
            <QueueBookArt
              book={nextBook}
              genreColor={nextGenre?.colorLight ?? colors.navyMuted}
              onPress={() => onOpenBook?.(nextBook.id)}
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

          const genre = genreById.get(book.genreId);

          return (
            <Pressable
              accessibilityLabel={`Abrir ${book.title}`}
              accessibilityRole="button"
              className="active:opacity-80"
              key={item.bookId}
              onPress={() => onOpenBook?.(book.id)}
            >
              <Card className="flex-row items-center gap-md">
                <QueueBookArt
                  book={book}
                  genreColor={genre?.colorLight ?? colors.navyMuted}
                  onPress={() => onOpenBook?.(book.id)}
                />
                <View className="flex-1 gap-xs">
                  <AppText variant="caption" tone="muted">
                    {index + 2}º na fila
                  </AppText>
                  <AppText variant="bodyStrong">{book.title}</AppText>
                  <AppText variant="caption" tone="muted">
                    {item.note}
                  </AppText>
                  <Chip label={`${item.plannedPages} pág.`} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
