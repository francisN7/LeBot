import { useMemo } from 'react';

import { useGenres } from '@/features/genres';
import { useBooks } from '@/features/library/use-books';
import { ACTIVE_WINDOW_DAYS, buildPlan } from '@/features/planner';
import { useQueueBookIds } from '@/features/queue/use-queue';
import { useRecentSessions } from '@/features/reading/use-recent-sessions';
import { useSettings } from '@/features/settings';

import { buildPlanView, readGoalPages } from './plan-view';

/**
 * Plano do dia + a leitura de hoje já aplicada. Recalcula a cada abertura (não
 * persiste): o motor é determinístico e as sessões são a única fonte de
 * verdade do progresso.
 *
 * `today` entra por parâmetro para os testes; em produção é o relógio local,
 * e a tela vira o dia sozinha na virada da meia-noite.
 */
export function useDailyPlan(today: Date = new Date()) {
  const { books } = useBooks();
  const { values } = useSettings();
  const { genreById } = useGenres();
  const queueBookIds = useQueueBookIds();

  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const dayStart = useMemo(
    () => new Date(year, month, day),
    [year, month, day],
  );

  const sessions = useRecentSessions(ACTIVE_WINDOW_DAYS, dayStart);
  const goalPages = readGoalPages(values['goal.pages']);

  const plan = useMemo(
    () =>
      buildPlan({
        today: dayStart,
        goalPages,
        books: books.map(({ id, genreId, status, pages, pagesRead }) => ({
          id,
          genreId,
          status,
          pages,
          pagesRead,
        })),
        sessions: sessions.map(({ bookId, readAt }) => ({ bookId, readAt })),
        queueBookIds,
      }),
    [dayStart, goalPages, books, sessions, queueBookIds],
  );

  const view = useMemo(
    () => buildPlanView({ plan, books, sessions, today: dayStart }),
    [plan, books, sessions, dayStart],
  );

  return { plan, view, genreById };
}
