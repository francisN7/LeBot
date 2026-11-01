import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AppText,
  BookArt,
  Button,
  Card,
  Chip,
  Mascot,
  Screen,
} from '@/components/ui';
import { UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import { CAP_MIN_GOAL_PAGES, LIGHT_DAY_PERCENT } from '@/features/planner';
import { ReadingForm } from '@/features/reading/ReadingForm';
import { useReadingSessions } from '@/features/reading/use-reading-sessions';
import { colors } from '@/theme';

import type { PlanBlock, PlanBlockStatus } from './types';
import { useDailyPlan } from './use-daily-plan';

const blockStatusLabel: Record<PlanBlockStatus, string> = {
  done: 'Feito',
  now: 'Agora',
  later: 'Depois',
};

type HojeScreenProps = {
  /** Vazio: a tela leva para a Ordem (rota dona da navegação). */
  onOpenQueue?: () => void;
};

function pagesLabel(pages: number): string {
  return pages === 1 ? '1 página' : `${pages} páginas`;
}

/**
 * Plano real do dia: meta, blocos por livro e registro a partir do bloco.
 * A tela não recalcula nada: só mostra `useDailyPlan` e chama `buildPlan` por
 * trás dele.
 */
export function HojeScreen({ onOpenQueue }: HojeScreenProps = {}) {
  const { view, genreById } = useDailyPlan();
  const [selected, setSelected] = useState<PlanBlock | null>(null);
  const { register } = useReadingSessions(selected?.book.id ?? '');

  const remaining = selected
    ? Math.max(1, selected.book.pages - selected.book.pagesRead)
    : 1;

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Hoje</AppText>
        <AppText tone="muted">{`Seu plano de hoje · ${view.dateLabel}`}</AppText>
      </View>

      <Animated.View entering={FadeInDown.delay(40).duration(260)}>
        <Card className="items-center gap-xs bg-pink">
          <AppText variant="label">Meta do dia</AppText>
          <AppText variant="display">{view.goal} páginas</AppText>
          <AppText variant="caption">
            {view.pagesToday >= view.goal
              ? `Meta batida · ${pagesLabel(view.pagesToday)} hoje`
              : `${view.pagesToday} de ${view.goal} páginas hoje`}
          </AppText>
          {view.lightDay ? (
            <AppText variant="caption" tone="accent">
              Volta leve: hoje vale {LIGHT_DAY_PERCENT}% da meta de{' '}
              {view.baseGoal}.
            </AppText>
          ) : null}
          {view.goal < CAP_MIN_GOAL_PAGES ? (
            <AppText variant="caption" tone="muted">
              Com {view.goal} páginas, o dia costuma render um livro só.
            </AppText>
          ) : null}
        </Card>
      </Animated.View>

      {view.empty ? null : (
        <Animated.View entering={FadeInDown.delay(120).duration(260)}>
          <Card className="flex-row items-center gap-md">
            <Mascot size={72} state={view.mascot} />
            <View className="flex-1 gap-xs">
              <AppText variant="label" tone="accent">
                LêBot diz
              </AppText>
              <AppText variant="subtitle">{view.message}</AppText>
            </View>
          </Card>
        </Animated.View>
      )}

      {view.empty ? (
        <Card className="items-center gap-sm">
          <Mascot size={96} state={view.mascot} />
          <AppText variant="subtitle">Nada para ler hoje</AppText>
          <AppText variant="caption" tone="muted">
            Nenhum livro em leitura ou na ordem com páginas restantes.
          </AppText>
          <Button label="Ver a ordem" onPress={() => onOpenQueue?.()} />
        </Card>
      ) : (
        <View className="gap-sm">
          <AppText variant="subtitle">Plano do dia</AppText>
          {view.blocks.map((block) => {
            const genre = genreById.get(block.book.genreId);
            const done = block.status === 'done';

            return (
              <Card className="gap-sm" key={block.book.id}>
                <View className="flex-row items-center gap-md">
                  <BookArt
                    book={block.book}
                    genreColor={genre?.colorLight ?? colors.navyMuted}
                  />
                  <View className="flex-1 gap-xs">
                    <AppText variant="bodyStrong">{block.book.title}</AppText>
                    <AppText variant="caption" tone="muted">
                      {`${genre?.name ?? UNKNOWN_GENRE_NAME} · ${block.pages} páginas`}
                    </AppText>
                    <View className="flex-row flex-wrap gap-xs">
                      <Chip
                        label={blockStatusLabel[block.status]}
                        selected={block.status === 'now'}
                      />
                      {block.suggestion ? <Chip label="sugestão" /> : null}
                      {block.finishes ? <Chip label="fecha o livro" /> : null}
                    </View>
                  </View>
                </View>
                <Button
                  label={done ? 'Registrar mais' : 'Registrar leitura'}
                  onPress={() => setSelected(block)}
                  size="sm"
                  testID={`register-${block.book.id}`}
                  variant={block.status === 'now' ? 'primary' : 'secondary'}
                />
              </Card>
            );
          })}
        </View>
      )}

      <View className="gap-sm">
        <AppText variant="subtitle">Lido hoje</AppText>
        {view.sessionsToday.length === 0 ? (
          <AppText variant="caption" tone="muted">
            Nada registrado hoje ainda.
          </AppText>
        ) : (
          view.sessionsToday.map((entry) => (
            <Card
              className="flex-row items-center justify-between gap-md"
              key={entry.id}
            >
              <View className="flex-1 gap-xs">
                <AppText variant="bodyStrong">{entry.bookTitle}</AppText>
                <AppText variant="caption" tone="muted">
                  {pagesLabel(entry.appliedPages)}
                </AppText>
              </View>
              <AppText variant="caption" tone="muted">
                {entry.timeLabel}
              </AppText>
            </Card>
          ))
        )}
      </View>

      <ReadingForm
        bookTitle={selected?.book.title ?? ''}
        defaultPages={Math.min(selected?.pages ?? 1, remaining)}
        onCancel={() => setSelected(null)}
        onSave={(pages) => {
          register(pages);
          setSelected(null);
        }}
        remaining={remaining}
        visible={selected !== null}
      />
    </Screen>
  );
}
