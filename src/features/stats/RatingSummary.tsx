import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, Card, RatingStars } from '@/components/ui';
import { colors } from '@/theme';

import { decimalLabel, sharePercent } from './charts';
import type { StatsRatedBook, StatsRatingBucket } from './types';

type RatingSummaryProps = {
  average: number | null;
  count: number;
  distribution: StatsRatingBucket[];
  /** Livros com resenha, para abrir a lista de uma nota. */
  books: StatsRatedBook[];
  onOpenBook?: (bookId: string) => void;
};

function reviewsLabel(count: number): string {
  return count === 1 ? '1 resenha' : `${count} resenhas`;
}

function ratedBooksLabel(count: number): string {
  return count === 1
    ? '1 livro com essa nota'
    : `${count} livros com essa nota`;
}

/**
 * Nota média, distribuição 5→1 e a lista dos livros de cada nota. Tocar numa
 * barra troca o conteúdo do cartão pelos títulos daquela nota, com um "Voltar
 * às notas" acima.
 */
export function RatingSummary({
  average,
  count,
  distribution,
  books,
  onOpenBook,
}: RatingSummaryProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const selectedBooks =
    selected === null ? [] : books.filter((book) => book.rating === selected);

  if (selected !== null) {
    return (
      <Card>
        <Button
          className="self-start"
          label="Voltar às notas"
          onPress={() => setSelected(null)}
          size="sm"
          variant="ghost"
        />

        <View className="gap-xs">
          <AppText variant="subtitle">{selected} estrelas</AppText>
          <AppText tone="muted" variant="caption">
            {ratedBooksLabel(selectedBooks.length)}
          </AppText>
        </View>

        <View className="gap-sm">
          {selectedBooks.map((book) => (
            <Pressable
              accessibilityLabel={
                onOpenBook ? `Abrir ${book.title}` : book.title
              }
              accessibilityRole={onOpenBook ? 'button' : 'text'}
              className="flex-row items-center gap-sm active:opacity-70"
              disabled={!onOpenBook}
              key={book.bookId}
              onPress={() => onOpenBook?.(book.bookId)}
            >
              <View className="flex-1 gap-xs">
                <AppText numberOfLines={1} variant="bodyStrong">
                  {book.title}
                </AppText>
                <AppText numberOfLines={1} tone="muted" variant="caption">
                  {book.author}
                </AppText>
              </View>
              <RatingStars size="sm" value={book.rating} />
            </Pressable>
          ))}
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View className="gap-xs">
        <AppText variant="subtitle">Suas notas</AppText>
        <AppText tone="muted" variant="caption">
          Todas as resenhas, de todos os períodos. Toque numa nota para ver os
          livros.
        </AppText>
      </View>

      {average === null ? (
        <AppText tone="muted">
          Sem resenhas ainda — a primeira nota aparece aqui.
        </AppText>
      ) : (
        <View className="gap-sm">
          <View className="flex-row items-center gap-md">
            <AppText variant="title">{decimalLabel(average)}</AppText>
            <View className="flex-1 gap-xs">
              <RatingStars size="sm" value={Math.round(average)} />
              <AppText tone="muted" variant="caption">
                {reviewsLabel(count)}
              </AppText>
            </View>
          </View>

          <View className="gap-xs">
            {distribution.map((bucket) => {
              const empty = bucket.count === 0;

              return (
                <Pressable
                  accessibilityHint={
                    empty ? undefined : 'Abre a lista de livros com essa nota'
                  }
                  accessibilityLabel={`Ver livros com nota ${bucket.rating}`}
                  accessibilityRole={empty ? 'text' : 'button'}
                  className="flex-row items-center gap-sm active:opacity-70"
                  disabled={empty}
                  key={bucket.rating}
                  onPress={() => setSelected(bucket.rating)}
                >
                  <AppText
                    numberOfLines={1}
                    style={{ width: 12 }}
                    variant="label"
                  >
                    {bucket.rating}
                  </AppText>
                  <View className="h-sm flex-1 overflow-hidden rounded-pill border border-navy bg-cream">
                    <View
                      className="h-full"
                      style={{
                        backgroundColor: colors.gold,
                        width: `${sharePercent(bucket.count, count)}%`,
                      }}
                    />
                  </View>
                  <AppText
                    numberOfLines={1}
                    style={{ textAlign: 'right', width: 20 }}
                    tone="muted"
                    variant="caption"
                  >
                    {bucket.count}
                  </AppText>
                  <AppText
                    style={{ opacity: empty ? 0 : 1 }}
                    tone="muted"
                    variant="label"
                  >
                    ›
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );
}
