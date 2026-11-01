import { View } from 'react-native';

import { AppText, Card, Spine } from '@/components/ui';
import { colors } from '@/theme';

import { shortMonth } from './period';
import type { StatsFinishedBook } from './types';

type FinishedStripProps = {
  books: StatsFinishedBook[];
  /** Cor de cada gênero; `null` cai no navy suave (gênero excluído). */
  genreColor: (genreId: string) => string | null;
  onOpenBook?: (bookId: string) => void;
};

function finishedLabel(count: number): string {
  return count === 1 ? '1 livro no período' : `${count} livros no período`;
}

/**
 * Fileira de mini-lombadas dos livros concluídos no período, na ordem da
 * conclusão. Cada lombada abre o livro; o mês embaixo dá o contexto sem
 * precisar de mais um gráfico.
 */
export function FinishedStrip({
  books,
  genreColor,
  onOpenBook,
}: FinishedStripProps) {
  return (
    <Card>
      <View className="gap-xs">
        <AppText variant="subtitle">Concluídos</AppText>
        <AppText tone="muted" variant="caption">
          {finishedLabel(books.length)}.
        </AppText>
      </View>

      <View className="flex-row flex-wrap gap-md">
        {books.map((book) => (
          <View
            className="items-center gap-xs"
            key={book.bookId}
            style={{ width: 48 }}
          >
            <Spine
              color={genreColor(book.genreId) ?? colors.navyMuted}
              height={60}
              onPress={onOpenBook ? () => onOpenBook(book.bookId) : undefined}
              showLabel={false}
              status="finished"
              title={book.title}
              width={30}
            />
            <AppText numberOfLines={1} tone="muted" variant="label">
              {shortMonth(book.at)}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}
