import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { colors, lineHeight } from '@/theme';

import { barHeight, barWidth, compactPages } from './charts';
import type { StatsBucket } from './types';

type RhythmChartProps = {
  buckets: (StatsBucket & { pages: number })[];
  /** Chave da semana/mês corrente: a barra ganha a cor do destaque. */
  currentKey: string;
};

function pagesLabel(pages: number): string {
  return pages === 1 ? '1 página' : `${pages} páginas`;
}

/**
 * Ritmo como prateleira: cada semana/mês é uma lombada em pé sobre uma linha
 * navy. A altura é proporcional às páginas; a coluna inteira é o elemento
 * acessível, com o número por extenso.
 */
export function RhythmChart({ buckets, currentKey }: RhythmChartProps) {
  const maxPages = Math.max(...buckets.map((bucket) => bucket.pages), 1);
  const width = barWidth(buckets.length);

  return (
    <Card>
      <View className="gap-xs">
        <AppText variant="subtitle">Ritmo</AppText>
        <AppText tone="muted" variant="caption">
          Páginas por {buckets.length > 12 ? 'mês' : 'semana'}.
        </AppText>
      </View>

      <View className="flex-row items-end justify-between border-b-2 border-navy">
        {buckets.map((bucket) => (
          <View
            accessibilityLabel={`${bucket.description}: ${pagesLabel(bucket.pages)}`}
            accessible
            className="items-center justify-end"
            key={bucket.key}
            style={{ paddingBottom: 2, width }}
          >
            <AppText
              numberOfLines={1}
              style={{ lineHeight: lineHeight.xs }}
              tone="muted"
              variant="label"
            >
              {compactPages(bucket.pages)}
            </AppText>
            <View
              className="w-full rounded-t-sm border-2 border-navy"
              style={{
                backgroundColor:
                  bucket.key === currentKey ? colors.gold : colors.pink,
                height: barHeight(bucket.pages, maxPages),
              }}
            />
          </View>
        ))}
      </View>

      <View className="flex-row justify-between">
        {buckets.map((bucket) => (
          <AppText
            key={bucket.key}
            numberOfLines={1}
            style={{ textAlign: 'center', width }}
            tone={bucket.key === currentKey ? 'default' : 'muted'}
            variant="label"
          >
            {bucket.label}
          </AppText>
        ))}
      </View>
    </Card>
  );
}
