import { View } from 'react-native';

import { AppText, Card, RatingStars } from '@/components/ui';
import { colors } from '@/theme';

import { decimalLabel, sharePercent } from './charts';
import type { StatsRatingBucket } from './types';

type RatingSummaryProps = {
  average: number | null;
  count: number;
  distribution: StatsRatingBucket[];
};

function reviewsLabel(count: number): string {
  return count === 1 ? '1 resenha' : `${count} resenhas`;
}

/** Nota média e distribuição 5→1 das resenhas de livros que ainda existem. */
export function RatingSummary({
  average,
  count,
  distribution,
}: RatingSummaryProps) {
  return (
    <Card>
      <View className="gap-xs">
        <AppText variant="subtitle">Suas notas</AppText>
        <AppText tone="muted" variant="caption">
          Todas as resenhas, de todos os períodos.
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
            {distribution.map((bucket) => (
              <View
                accessibilityLabel={`${bucket.rating} estrelas: ${bucket.count}`}
                accessible
                className="flex-row items-center gap-sm"
                key={bucket.rating}
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
              </View>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}
