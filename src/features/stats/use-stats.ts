import { useCallback, useEffect, useMemo, useState } from 'react';

import { useGenres } from '@/features/genres';
import { useBooks } from '@/features/library/use-books';
import {
  subscribeToReadingSessions,
  useReadingSessionsRepository,
} from '@/features/reading/use-reading-sessions';
import { useReviews } from '@/features/reviews';
import { addLocalDays } from '@/lib/day';

import { aggregateStats } from './aggregate';
import { statsRange } from './period';
import type { StatsPeriod } from './types';

/**
 * A sequência atual pode ser mais longa que o período (12 semanas, ano). Um
 * ano de sessões cobre qualquer sequência plausível sem ler a tabela inteira.
 */
export const STREAK_WINDOW_DAYS = 366;

/**
 * Números de "Meu ritmo" para um período. Recalcula ao trocar o período e
 * quando uma sessão é gravada/desfeita; livros, gêneros e resenhas vêm dos
 * hooks que já avisam a tela.
 *
 * `today` entra por parâmetro para os testes; em produção é o relógio local.
 */
export function useStats(period: StatsPeriod, today: Date = new Date()) {
  const sessionsRepository = useReadingSessionsRepository();
  const { books } = useBooks();
  const { genres } = useGenres();
  const { reviews } = useReviews();

  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const todayStart = useMemo(
    () => new Date(year, month, day),
    [year, month, day],
  );
  const range = useMemo(
    () => statsRange(period, todayStart),
    [period, todayStart],
  );
  const streakFrom = useMemo(
    () => addLocalDays(todayStart, -STREAK_WINDOW_DAYS),
    [todayStart],
  );

  const load = useCallback(() => {
    const windowStart =
      range.from.getTime() < streakFrom.getTime() ? range.from : streakFrom;

    return {
      sessions: sessionsRepository.listBetween(windowStart, range.to),
      previousSessions: sessionsRepository.listBetween(
        range.previous.from,
        range.previous.to,
      ),
      latestPerBook: sessionsRepository.listLatestPerBook(),
    };
  }, [sessionsRepository, range, streakFrom]);

  const [loaded, setLoaded] = useState(load);

  useEffect(() => {
    setLoaded(load());
  }, [load]);

  useEffect(
    () =>
      subscribeToReadingSessions(sessionsRepository, () => setLoaded(load())),
    [sessionsRepository, load],
  );

  return useMemo(
    () =>
      aggregateStats({
        period,
        today: todayStart,
        ...loaded,
        books,
        genres,
        reviews,
      }),
    [period, todayStart, loaded, books, genres, reviews],
  );
}
