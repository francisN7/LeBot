import { useState } from 'react';
import { View } from 'react-native';

import {
  AppText,
  BackButton,
  Button,
  Card,
  Chip,
  Mascot,
  Screen,
} from '@/components/ui';
import { useGenres } from '@/features/genres';

import { FinishedStrip } from './FinishedStrip';
import { GenreBars } from './GenreBars';
import { RatingSummary } from './RatingSummary';
import { RhythmChart } from './RhythmChart';
import type { StatsPeriod } from './types';
import { useStats } from './use-stats';

const periodOptions: { value: StatsPeriod; label: string }[] = [
  { value: '4w', label: '4 semanas' },
  { value: '12w', label: '12 semanas' },
  { value: 'year', label: 'Ano' },
];

type StatsScreenProps = {
  onBack: () => void;
  onOpenBook?: (bookId: string) => void;
  /** Atalho do estado vazio; a rota decide para onde ir. */
  onGoToToday?: () => void;
  /** Relógio injetável para os testes; em produção é o agora. */
  today?: Date;
};

function StatNumber({ label, value }: { label: string; value: number }) {
  return (
    <View
      accessibilityLabel={`${value} ${label}`}
      accessible
      className="flex-1 items-center gap-xs"
    >
      <AppText variant="title">{value}</AppText>
      <AppText
        numberOfLines={1}
        style={{ textAlign: 'center' }}
        tone="muted"
        variant="label"
      >
        {label}
      </AppText>
    </View>
  );
}

function Divider() {
  return (
    <View className="w-px self-stretch bg-navy" style={{ opacity: 0.15 }} />
  );
}

function activeDaysNote(activeDays: number, average: number): string {
  if (activeDays === 0) {
    return 'Nenhum dia ativo no período.';
  }

  return activeDays === 1
    ? `1 dia ativo, com média de ${average} páginas.`
    : `${activeDays} dias ativos, com média de ${average} páginas por dia.`;
}

/**
 * "Meu ritmo": números reais do aparelho, sem gráfico de biblioteca. O LêBot
 * comenta o diário com uma frase; o resto é dado.
 */
export function StatsScreen({
  onBack,
  onOpenBook,
  onGoToToday,
  today,
}: StatsScreenProps) {
  const [period, setPeriod] = useState<StatsPeriod>('4w');
  const stats = useStats(period, today);
  const { genreById } = useGenres();
  const currentKey = stats.buckets.at(-1)?.key ?? '';

  return (
    <Screen>
      <BackButton onPress={onBack} />

      <View className="gap-xs">
        <AppText variant="display">Meu ritmo</AppText>
        <AppText tone="muted">{stats.range.label}</AppText>
      </View>

      <View className="flex-row flex-wrap gap-sm">
        {periodOptions.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            onPress={() => setPeriod(option.value)}
            selected={period === option.value}
            testID={`period-${option.value}`}
          />
        ))}
      </View>

      {stats.hasData ? (
        <>
          <Card className="flex-row items-center gap-md">
            <Mascot size={64} state={stats.insight.mood} />
            <View className="flex-1 gap-xs">
              <AppText tone="accent" variant="label">
                LêBot diz
              </AppText>
              <AppText variant="subtitle">{stats.insight.text}</AppText>
              {stats.streak >= 2 ? (
                <View
                  className="self-start rounded-pill border-2 border-navy bg-gold px-sm py-xs"
                  style={{ transform: [{ rotate: '-3deg' }] }}
                >
                  <AppText numberOfLines={1} variant="label">
                    {stats.streak} dias seguidos
                  </AppText>
                </View>
              ) : null}
            </View>
          </Card>

          <View className="gap-xs">
            <Card className="flex-row items-center">
              <StatNumber label="páginas" value={stats.pages} />
              <Divider />
              <StatNumber label="dias ativos" value={stats.activeDays} />
              <Divider />
              <StatNumber label="dias seguidos" value={stats.streak} />
            </Card>
            <AppText tone="muted" variant="caption">
              {activeDaysNote(stats.activeDays, stats.averagePerActiveDay)}
            </AppText>
          </View>

          <RhythmChart buckets={stats.buckets} currentKey={currentKey} />

          {stats.genres.length > 0 ? (
            <GenreBars genres={stats.genres} pages={stats.pages} />
          ) : null}

          {stats.finished.length > 0 ? (
            <FinishedStrip
              books={stats.finished}
              genreColor={(genreId) =>
                genreById.get(genreId)?.colorLight ?? null
              }
              onOpenBook={onOpenBook}
            />
          ) : null}

          <RatingSummary
            average={stats.ratings.average}
            count={stats.ratings.count}
            distribution={stats.ratings.distribution}
          />
        </>
      ) : (
        <Card className="items-center gap-sm">
          <Mascot size={96} state="thinking" />
          <AppText variant="subtitle">
            Ainda não tem páginas neste período
          </AppText>
          <AppText
            style={{ textAlign: 'center' }}
            tone="muted"
            variant="caption"
          >
            O diário começa quando você lê. Registre uma leitura e volte aqui.
          </AppText>
          {onGoToToday ? (
            <Button label="Ir para Hoje" onPress={onGoToToday} />
          ) : null}
        </Card>
      )}
    </Screen>
  );
}
