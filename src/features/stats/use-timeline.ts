import { useCallback, useEffect, useMemo, useState } from 'react';

import { useBooks } from '@/features/library/use-books';
import {
  subscribeToReadingSessions,
  useReadingSessionsRepository,
} from '@/features/reading/use-reading-sessions';

import { buildTimeline } from './timeline';

/**
 * Todo o histórico do aparelho. Separado de `useStats`: a linha do tempo não
 * tem janela e só é montada quando a tela "Ver tudo" abre.
 */
export function useTimeline(today: Date = new Date()) {
  const repository = useReadingSessionsRepository();
  const { books } = useBooks();

  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const todayStart = useMemo(
    () => new Date(year, month, day),
    [year, month, day],
  );

  const load = useCallback(
    () => ({
      sessions: repository.listAll(),
      latestPerBook: repository.listLatestPerBook(),
    }),
    [repository],
  );

  const [rows, setRows] = useState(load);

  useEffect(() => {
    setRows(load());
  }, [load]);

  useEffect(
    () => subscribeToReadingSessions(repository, () => setRows(load())),
    [repository, load],
  );

  return useMemo(
    () => buildTimeline({ today: todayStart, ...rows, books }),
    [todayStart, rows, books],
  );
}
