import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText, Card, Chip, Screen, Spine } from '@/components/ui';
import { books } from './__fixtures__/books';
import { colorForGenre, genreLabel, labelForStatus } from './genre';
import type { ReadingStatus } from './types';

type ShelfFilter = 'all' | ReadingStatus;

const filters: { value: ShelfFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'reading', label: 'Lendo' },
  { value: 'queued', label: 'Quero ler' },
  { value: 'paused', label: 'Pausados' },
  { value: 'finished', label: 'Concluídos' },
];

export function EstanteScreen() {
  const [filter, setFilter] = useState<ShelfFilter>('all');
  const visibleBooks =
    filter === 'all' ? books : books.filter((book) => book.status === filter);

  function openBook(title: string) {
    Alert.alert('Em breve', `O cadastro de "${title}" chega na S3.`);
  }

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Estante</AppText>
        <AppText tone="muted">
          {books.length} livros · {visibleBooks.length} à vista
        </AppText>
      </View>

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
        {visibleBooks.map((book) => (
          <Card className="w-[46%] items-center gap-sm" key={book.id}>
            <Spine
              color={colorForGenre(book.genre)}
              onPress={() => openBook(book.title)}
              title={book.title}
            />
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {book.author}
            </AppText>
            <AppText variant="label">{genreLabel[book.genre]}</AppText>
            <Chip label={labelForStatus(book.status)} />
          </Card>
        ))}
      </View>

      {visibleBooks.length === 0 ? (
        <AppText tone="muted">
          Nada por aqui ainda. Ajuste o filtro para ver outros livros.
        </AppText>
      ) : null}
    </Screen>
  );
}
