import { useCallback, useEffect, useState } from 'react';

import { type ReadingSession, toReadingSession } from './types';
import {
  subscribeToReadingSessions,
  useReadingSessionsRepository,
} from './use-reading-sessions';

/**
 * Sessões dos últimos `windowDays` dias (contando hoje) mais a sessão mais
 * recente de qualquer data. A janela cobre o livro ativo; a sessão antiga é o
 * que permite reconhecer a volta leve depois de semanas sem ler.
 *
 * `today` pode vir de qualquer hora do dia: a janela usa só o dia local.
 */
export function useRecentSessions(
  windowDays: number,
  today: Date,
): ReadingSession[] {
  const repository = useReadingSessionsRepository();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const load = useCallback(() => {
    const from = new Date(year, month, day - (windowDays - 1));
    const to = new Date(year, month, day, 23, 59, 59, 999);
    const recent = repository.listBetween(from, to).map(toReadingSession);
    const latestRow = repository.latest();
    const latest = latestRow ? toReadingSession(latestRow) : undefined;
    const all =
      latest && !recent.some((session) => session.id === latest.id)
        ? [...recent, latest]
        : recent;

    return all.sort(
      (first, second) =>
        first.readAt.getTime() - second.readAt.getTime() ||
        first.id.localeCompare(second.id),
    );
  }, [repository, windowDays, year, month, day]);

  const [sessions, setSessions] = useState<ReadingSession[]>(load);

  useEffect(() => {
    setSessions(load());
  }, [load]);

  useEffect(
    () => subscribeToReadingSessions(repository, () => setSessions(load())),
    [repository, load],
  );

  return sessions;
}
