import { useMemo } from 'react';

import { queue } from './__fixtures__/queue';

/**
 * Ids na ordem definida pelo dono, que o motor do plano usa para desempatar e
 * escolher o próximo livro. Hoje vem da fixture; a S8 troca pela ordem
 * persistida sem a tela Hoje saber.
 */
export function useQueueBookIds(): string[] {
  return useMemo(() => queue.map((item) => item.bookId), []);
}
