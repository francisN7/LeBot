import { useMemo } from 'react';

import { queue } from './__fixtures__/queue';

/**
 * Ids na ordem da fila, que o motor do plano usa para desempatar e escolher o
 * próximo livro. Hoje vem da fixture; a S8 troca pela fila persistida sem a
 * tela Hoje saber.
 */
export function useQueueBookIds(): string[] {
  return useMemo(() => queue.map((item) => item.bookId), []);
}
