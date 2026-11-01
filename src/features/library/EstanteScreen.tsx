import { useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  AppText,
  BookCover,
  Button,
  Card,
  Chip,
  Mascot,
  Screen,
  Spine,
  TextField,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { matchesQuery } from '@/lib/book-search';
import { hasCover } from '@/lib/covers';
import { colors } from '@/theme';

import { labelForStatus, UNKNOWN_GENRE_NAME } from './genre';
import { QuickStatusSheet } from './quick-status-sheet';
import type { ReadingStatus } from './types';
import { useBooks } from './use-books';

type ShelfFilter = 'all' | ReadingStatus;

type EstanteScreenProps = {
  onOpenBook?: (bookId: string) => void;
  onCreateBook?: () => void;
};

const filters: { value: ShelfFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'reading', label: 'Lendo' },
  { value: 'queued', label: 'Quero ler' },
  { value: 'paused', label: 'Pausados' },
  { value: 'finished', label: 'Concluídos' },
];

/**
 * Profundidade discreta do card na grade: sombra navy curta e deslocada para
 * baixo, alternando a altura por coluna para a estante não parecer um bloco só.
 */
function shelfDepth(offset: number): ViewStyle {
  return {
    elevation: 3,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: offset },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  };
}

export function EstanteScreen({
  onOpenBook,
  onCreateBook,
}: EstanteScreenProps = {}) {
  const [filter, setFilter] = useState<ShelfFilter>('all');
  const [query, setQuery] = useState('');
  const [quickStatus, setQuickStatus] = useState<{
    bookId: string;
    preview: ReadingStatus;
  } | null>(null);
  const { books, update } = useBooks();
  const { genreById } = useGenres();

  const quickBook = quickStatus
    ? books.find((book) => book.id === quickStatus.bookId)
    : undefined;

  function openStatusWheel(book: { id: string; status: ReadingStatus }) {
    setQuickStatus({ bookId: book.id, preview: book.status });
  }

  function cancelStatusWheel() {
    setQuickStatus(null);
  }

  function commitStatus(status: ReadingStatus) {
    if (!quickStatus) {
      return;
    }

    const book = books.find((item) => item.id === quickStatus.bookId);

    // Escolher o status atual fecha a folha sem escrever de novo.
    if (book && book.status !== status) {
      update(book.id, { status });
    }

    setQuickStatus(null);
  }

  const visibleBooks = books.filter(
    (book) =>
      (filter === 'all' || book.status === filter) &&
      matchesQuery([book.title, book.author, book.isbn], query),
  );

  const hasQuery = query.trim().length > 0;
  const emptyState = hasQuery
    ? 'Nenhum livro encontrado. Tente outro título, autor ou ISBN.'
    : books.length === 0
      ? 'Sua estante está vazia. Toque em Novo livro para começar.'
      : 'Nada por aqui ainda. Ajuste o filtro para ver outros livros.';

  return (
    <Screen>
      <View className="gap-sm">
        <View className="flex-row items-center justify-between gap-sm">
          <AppText variant="display">Estante</AppText>
          <Button
            label="Novo livro"
            onPress={onCreateBook}
            size="sm"
            testID="novo-livro"
          />
        </View>
        <AppText tone="muted">
          {books.length} livros · {visibleBooks.length} à vista
        </AppText>
      </View>

      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        label="Buscar"
        onChangeText={setQuery}
        placeholder="Título, autor ou ISBN"
        returnKeyType="search"
        value={query}
      />

      <View className="flex-row flex-wrap gap-sm">
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            onPress={() => setFilter(item.value)}
            selected={filter === item.value}
          />
        ))}
      </View>

      <Animated.View
        entering={FadeIn.duration(180)}
        key={`${filter}:${hasQuery ? query.trim() : ''}`}
        testID="estante-grade"
      >
        <View className="flex-row flex-wrap gap-md">
          {visibleBooks.map((book, index) => {
            const genre = genreById.get(book.genreId);
            const genreColor = genre?.colorLight ?? colors.navyMuted;
            const displayStatus =
              quickStatus?.bookId === book.id
                ? quickStatus.preview
                : book.status;

            return (
              <Animated.View
                entering={FadeInDown.delay(Math.min(index, 6) * 45).duration(
                  240,
                )}
                key={book.id}
                style={{ width: '46%' }}
              >
                <Card
                  className="w-full items-center gap-sm"
                  style={shelfDepth(index % 2 === 0 ? 3 : 5)}
                >
                  {hasCover(book.coverUri) ? (
                    <BookCover
                      genreColor={genreColor}
                      onPress={() => onOpenBook?.(book.id)}
                      status={displayStatus}
                      title={book.title}
                      uri={book.coverUri}
                    />
                  ) : (
                    <Spine
                      color={genreColor}
                      onPress={() => onOpenBook?.(book.id)}
                      showLabel={false}
                      status={displayStatus}
                      testID={`lombada-${book.id}`}
                      title={book.title}
                    />
                  )}
                  <AppText
                    numberOfLines={1}
                    style={{ alignSelf: 'stretch', textAlign: 'center' }}
                    variant="bodyStrong"
                  >
                    {book.title}
                  </AppText>
                  <AppText
                    numberOfLines={1}
                    style={{ alignSelf: 'stretch', textAlign: 'center' }}
                    tone="muted"
                    variant="caption"
                  >
                    {book.author}
                  </AppText>
                  <AppText
                    numberOfLines={1}
                    style={{ alignSelf: 'stretch', textAlign: 'center' }}
                    variant="label"
                  >
                    {genre?.name ?? UNKNOWN_GENRE_NAME}
                  </AppText>
                  <Chip
                    accessibilityActions={[
                      { name: 'openStatusWheel', label: 'Trocar status' },
                    ]}
                    accessibilityHint="Segure para trocar o status"
                    delayLongPress={500}
                    label={labelForStatus(displayStatus)}
                    onAccessibilityAction={(event) => {
                      if (event.nativeEvent.actionName === 'openStatusWheel') {
                        openStatusWheel(book);
                      }
                    }}
                    onLongPress={() => openStatusWheel(book)}
                    testID={`status-${book.id}`}
                  />
                </Card>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {visibleBooks.length === 0 ? (
        <Card className="items-center gap-sm p-lg" style={shelfDepth(2)}>
          <Mascot size={96} state={hasQuery ? 'thinking' : 'neutral'} />
          <AppText style={{ textAlign: 'center' }} tone="muted">
            {emptyState}
          </AppText>
        </Card>
      ) : null}

      {quickStatus && quickBook ? (
        <QuickStatusSheet
          book={quickBook}
          genreColor={
            genreById.get(quickBook.genreId)?.colorLight ?? colors.navyMuted
          }
          onCancel={cancelStatusWheel}
          onCommit={commitStatus}
          onPreview={(preview) =>
            setQuickStatus((current) =>
              current ? { ...current, preview } : current,
            )
          }
          preview={quickStatus.preview}
        />
      ) : null}
    </Screen>
  );
}
