import type { ReadingStatus } from './types';

/** Nome usado quando o gênero do livro foi excluído fora do app. */
export const UNKNOWN_GENRE_NAME = 'Sem gênero';

export const statusLabel: Record<ReadingStatus, string> = {
  reading: 'Lendo',
  queued: 'Quero ler',
  paused: 'Pausado',
  finished: 'Concluído',
};

export function labelForStatus(status: ReadingStatus): string {
  return statusLabel[status];
}
