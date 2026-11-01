import { View } from 'react-native';

import { AppText, BackButton, Card, Mascot, Screen } from '@/components/ui';
import { colors } from '@/theme';

import { barHeight, barWidth, compactPages } from './charts';
import { longMonth } from './period';
import { countLabel, StatDivider, StatNumber } from './StatNumber';
import type { TimelineYear } from './timeline';
import { useTimeline } from './use-timeline';

type TimelineScreenProps = {
  onBack: () => void;
  /** Relógio injetável para os testes; em produção é o agora. */
  today?: Date;
};

function monthsLabel(count: number): string {
  return count === 1 ? '1 mês com leitura' : `${count} meses com leitura`;
}

function pagesLabel(pages: number): string {
  return pages === 1 ? '1 página' : `${pages} páginas`;
}

function yearSummary(year: TimelineYear): string {
  const days = year.activeDays === 1 ? '1 dia' : `${year.activeDays} dias`;
  const finished =
    year.finished === 1 ? '1 concluído' : `${year.finished} concluídos`;

  return `${year.pages} pág · ${days} · ${finished}`;
}

function YearCard({ year }: { year: TimelineYear }) {
  const maxPages = Math.max(...year.months.map((month) => month.pages), 1);
  const width = barWidth(year.months.length);

  return (
    <Card>
      <View className="gap-xs">
        <View className="flex-row items-baseline justify-between gap-sm">
          <AppText variant="subtitle">{year.year}</AppText>
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {yearSummary(year)}
          </AppText>
        </View>
      </View>

      <View className="flex-row items-end justify-between border-b-2 border-navy">
        {year.months.map((month) => (
          <View
            accessibilityLabel={`${month.description}: ${pagesLabel(month.pages)}`}
            accessible
            className="flex-1 items-center justify-end"
            key={month.key}
            style={{ paddingBottom: 2 }}
          >
            <AppText numberOfLines={1} tone="muted" variant="label">
              {compactPages(month.pages)}
            </AppText>
            <View
              className="rounded-t-sm border-2 border-navy"
              style={{
                backgroundColor: month.current
                  ? colors.gold
                  : month.pages > 0
                    ? colors.pink
                    : colors.cream,
                height: barHeight(month.pages, maxPages),
                width,
              }}
            />
          </View>
        ))}
      </View>

      <View className="flex-row justify-between">
        {year.months.map((month) => (
          <AppText
            key={month.key}
            numberOfLines={1}
            style={{ flex: 1, textAlign: 'center' }}
            tone={month.current ? 'default' : 'muted'}
            variant="label"
          >
            {month.label}
          </AppText>
        ))}
      </View>
    </Card>
  );
}

/**
 * "Ver tudo": o histórico inteiro, sem os filtros de período. Totais desde a
 * primeira sessão e uma grade jan→dez por ano.
 */
export function TimelineScreen({ onBack, today }: TimelineScreenProps) {
  const timeline = useTimeline(today);

  return (
    <Screen>
      <BackButton onPress={onBack} />

      <View className="gap-xs">
        <AppText variant="display">Linha do tempo</AppText>
        <AppText tone="muted">
          {timeline.from
            ? `Desde ${longMonth(timeline.from).toLowerCase()} de ${timeline.from.getFullYear()}`
            : 'Ainda sem leituras'}
        </AppText>
      </View>

      {timeline.years.length === 0 ? (
        <Card className="items-center gap-sm">
          <Mascot size={96} state="thinking" />
          <AppText variant="subtitle">O diário começa quando você lê</AppText>
          <AppText
            style={{ textAlign: 'center' }}
            tone="muted"
            variant="caption"
          >
            Registre uma leitura na Hoje ou no livro e volte aqui.
          </AppText>
        </Card>
      ) : (
        <>
          <View className="gap-xs">
            <Card className="flex-row items-center">
              <StatNumber
                accessibilityLabel={countLabel(
                  timeline.pages,
                  'página',
                  'páginas',
                )}
                label="páginas"
                value={timeline.pages}
              />
              <StatDivider />
              <StatNumber
                accessibilityLabel={countLabel(
                  timeline.activeDays,
                  'dia com leitura',
                  'dias com leitura',
                )}
                label="dias com leitura"
                value={timeline.activeDays}
              />
              <StatDivider />
              <StatNumber
                accessibilityLabel={countLabel(
                  timeline.finished,
                  'livro concluído',
                  'livros concluídos',
                )}
                label="concluídos"
                value={timeline.finished}
              />
            </Card>
            <AppText tone="muted" variant="caption">
              {monthsLabel(timeline.monthsWithReading)} desde então.
            </AppText>
          </View>

          {timeline.years.map((year) => (
            <YearCard key={year.year} year={year} />
          ))}
        </>
      )}
    </Screen>
  );
}
