import { useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  AppText,
  BookCover,
  Button,
  Card,
  Chip,
  Mascot,
  RatingStars,
  Screen,
  Spine,
  StatsIcon,
  TextField,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { useReviews } from '@/features/reviews/use-reviews';
import { matchesQuery } from '@/lib/book-search';
import { hasCover } from '@/lib/covers';
import { colors } from '@/theme';

import { labelForStatus, UNKNOWN_GENRE_NAME } from './genre';
import type { Area, Point } from './status-wheel-geometry';
import { StatusWheelOverlay } from './status-wheel-overlay';
import { StatusWheelTrigger } from './status-wheel-trigger';
import type { ReadingStatus } from './types';
import { useBooks } from './use-books';

type ShelfFilter = 'all' | ReadingStatus;

type EstanteScreenProps = {
  onOpenBook?: (bookId: string) => void;
  onCreateBook?: () => void;
  /** Abre "Meu ritmo" (estatísticas); sem a prop, o atalho não aparece. */
  onOpenStats?: () => void;
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

type QuickStatusState = {
  bookId: string;
  preview: ReadingStatus;
  original: ReadingStatus;
  anchor: Point;
  closing: boolean;
};

export function EstanteScreen({
  onOpenBook,
  onCreateBook,
  onOpenStats,
}: EstanteScreenProps = {}) {
  const [filter, setFilter] = useState<ShelfFilter>('all');
  const [query, setQuery] = useState('');
  const [wheelArea, setWheelArea] = useState<Area>({ width: 0, height: 0 });
  const [quickStatus, setQuickStatus] = useState<QuickStatusState | null>(null);
  const { books, update } = useBooks();
  const { genreById } = useGenres();
  const { byBook: reviewsByBook } = useReviews();

  function measureWheelArea(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;

    setWheelArea((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  }

  function openStatusWheel(bookId: string, anchor: Point) {
    const book = books.find((item) => item.id === bookId);

    if (!book) {
      return;
    }

    setQuickStatus({
      anchor,
      bookId,
      closing: false,
      original: book.status,
      preview: book.status,
    });
  }

  function previewStatus(bookId: string, status: ReadingStatus | null) {
    setQuickStatus((current) => {
      if (
        !current ||
        current.bookId !== bookId ||
        current.closing ||
        current.preview === (status ?? current.original)
      ) {
        return current;
      }

      return { ...current, preview: status ?? current.original };
    });
  }

  function closeStatusWheel() {
    setQuickStatus((current) =>
      current && !current.closing ? { ...current, closing: true } : current,
    );
  }

  function settleStatus(bookId: string, status: ReadingStatus | null) {
    if (!quickStatus || quickStatus.bookId !== bookId) {
      return;
    }

    const book = books.find((item) => item.id === bookId);

    // O status atual fecha sem escrever; `null` (miolo) cancela.
    if (book && status && book.status !== status) {
      update(book.id, { status });
    }

    setQuickStatus((current) =>
      current && !current.closing
        ? {
            ...current,
            closing: true,
            preview: status ?? current.original,
          }
        : current,
    );
  }

  function selectStatus(status: ReadingStatus) {
    if (quickStatus) {
      settleStatus(quickStatus.bookId, status);
    }
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
    <View className="flex-1" onLayout={measureWheelArea}>
      <View
        accessibilityElementsHidden={quickStatus !== null}
        className="flex-1"
        importantForAccessibility={quickStatus ? 'no-hide-descendants' : 'auto'}
      >
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
            {onOpenStats ? (
              <Pressable
                accessibilityLabel="Ver estatísticas de leitura"
                accessibilityRole="button"
                className="flex-row items-center gap-xs self-start active:opacity-60"
                hitSlop={8}
                onPress={onOpenStats}
              >
                <StatsIcon size={16} />
                <AppText numberOfLines={1} tone="muted" variant="label">
                  Meu ritmo
                </AppText>
              </Pressable>
            ) : null}
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
                    entering={FadeInDown.delay(
                      Math.min(index, 6) * 45,
                    ).duration(240)}
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
                      {/* Altura fixa: o selo não pode mudar a altura do card
                          e desalinhar a grade. */}
                      <View
                        className="h-6 justify-center"
                        testID={`slot-resenha-${book.id}`}
                      >
                        {displayStatus === 'finished' &&
                        reviewsByBook.get(book.id) ? (
                          <RatingStars
                            size="sm"
                            testID={`resenha-${book.id}`}
                            value={reviewsByBook.get(book.id)?.rating ?? 0}
                          />
                        ) : null}
                      </View>
                      <StatusWheelTrigger
                        area={wheelArea}
                        label={labelForStatus(displayStatus)}
                        onOpen={(anchor) => openStatusWheel(book.id, anchor)}
                        onPreview={(status) => previewStatus(book.id, status)}
                        onSettle={(status) => settleStatus(book.id, status)}
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
        </Screen>
      </View>

      {quickStatus ? (
        <StatusWheelOverlay
          anchor={quickStatus.anchor}
          closing={quickStatus.closing}
          onCancel={closeStatusWheel}
          onClosed={() => setQuickStatus(null)}
          onSelect={selectStatus}
          preview={quickStatus.preview}
        />
      ) : null}
    </View>
  );
}
