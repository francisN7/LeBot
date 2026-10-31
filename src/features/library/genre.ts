import { colors } from '@/theme';

import type { BookGenre, ReadingStatus } from './types';

export const genreLabel: Record<BookGenre, string> = {
  fantasy: 'Fantasia',
  romance: 'Romance',
  nonfiction: 'Não-ficção',
  classic: 'Clássico',
  children: 'Infantojuvenil',
  horror: 'Terror',
};

export const genreColor: Record<BookGenre, string> = {
  fantasy: colors.purple,
  romance: colors.coral,
  nonfiction: colors.teal,
  classic: colors.navy,
  children: colors.gold,
  horror: colors.pink,
};

export const statusLabel: Record<ReadingStatus, string> = {
  reading: 'Lendo',
  queued: 'Quero ler',
  paused: 'Pausado',
  finished: 'Concluído',
};

export function colorForGenre(genre: BookGenre): string {
  return genreColor[genre];
}

export function labelForStatus(status: ReadingStatus): string {
  return statusLabel[status];
}
