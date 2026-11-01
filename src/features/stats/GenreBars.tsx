import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { colors } from '@/theme';

import { sharePercent } from './charts';
import type { StatsGenre } from './types';

type GenreBarsProps = {
  genres: StatsGenre[];
  /** Total de páginas do período, para a fatia de cada barra. */
  pages: number;
};

function finishedLabel(count: number): string {
  return count === 1 ? '1 concluído' : `${count} concluídos`;
}

/**
 * Distribuição por gênero em barras horizontais na cor do gênero. Páginas
 * medem o esforço do período; os concluídos aparecem como número secundário.
 */
export function GenreBars({ genres, pages }: GenreBarsProps) {
  return (
    <Card>
      <View className="gap-xs">
        <AppText variant="subtitle">Gêneros</AppText>
        <AppText tone="muted" variant="caption">
          Páginas do período e livros concluídos em cada prateleira.
        </AppText>
      </View>

      <View className="gap-sm">
        {genres.map((genre) => (
          <View
            accessibilityLabel={`${genre.name}: ${genre.pages} páginas e ${finishedLabel(genre.finished)}`}
            accessible
            className="gap-xs"
            key={genre.id}
          >
            <View className="flex-row items-baseline justify-between gap-sm">
              <AppText
                numberOfLines={1}
                style={{ flex: 1 }}
                variant="bodyStrong"
              >
                {genre.name}
              </AppText>
              <AppText numberOfLines={1} tone="muted" variant="caption">
                {genre.pages} pág · {finishedLabel(genre.finished)}
              </AppText>
            </View>

            <View className="h-sm overflow-hidden rounded-pill border-2 border-navy bg-cream">
              <View
                className="h-full"
                style={{
                  backgroundColor: genre.color ?? colors.navyMuted,
                  width: `${sharePercent(genre.pages, pages)}%`,
                }}
              />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
