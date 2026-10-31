import { useState } from 'react';
import { View } from 'react-native';

import {
  AppText,
  BookCover,
  Button,
  Card,
  Chip,
  Screen,
  Spine,
  TextField,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { matchesQuery } from '@/lib/book-search';
import { hasCover } from '@/lib/covers';
import { colors } from '@/theme';

import { labelForStatus, UNKNOWN_GENRE_NAME } from './genre';
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

export function EstanteScreen({
  onOpenBook,
  onCreateBook,
}: EstanteScreenProps = {}) {
  const [filter, setFilter] = useState<ShelfFilter>('all');
  const [query, setQuery] = useState('');
  const { books } = useBooks();
  const { genreById } = useGenres();

  const visibleBooks = books.filter(
    (book) =>
      (filter === 'all' || book.status === filter) &&
      matchesQuery([book.title, book.author, book.isbn], query),
  );

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

      <View className="flex-row flex-wrap gap-md">
        {visibleBooks.map((book) => {
          const genre = genreById.get(book.genreId);

          return (
            <Card className="w-[46%] items-center gap-sm" key={book.id}>
              {hasCover(book.coverUri) ? (
                <BookCover
                  genreColor={genre?.colorLight ?? colors.navyMuted}
                  onPress={() => onOpenBook?.(book.id)}
                  title={book.title}
                  uri={book.coverUri}
                />
              ) : (
                <Spine
                  color={genre?.colorLight ?? colors.navyMuted}
                  onPress={() => onOpenBook?.(book.id)}
                  showLabel={false}
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
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {book.author}
              </AppText>
              <AppText
                numberOfLines={1}
                style={{ alignSelf: 'stretch', textAlign: 'center' }}
                variant="label"
              >
                {genre?.name ?? UNKNOWN_GENRE_NAME}
              </AppText>
              <Chip label={labelForStatus(book.status)} />
            </Card>
          );
        })}
      </View>

      {visibleBooks.length === 0 ? (
        <AppText tone="muted">
          {query.trim().length > 0
            ? 'Nenhum livro encontrado. Tente outro título, autor ou ISBN.'
            : 'Nada por aqui ainda. Ajuste o filtro para ver outros livros.'}
        </AppText>
      ) : null}
    </Screen>
  );
}
