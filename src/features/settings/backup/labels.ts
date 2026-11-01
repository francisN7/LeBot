import type { BackupCounts } from './types';

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

/** Resumo curto usado nas confirmações e no sucesso da restauração. */
export function backupCountsLabel(
  counts: Pick<BackupCounts, 'books' | 'sessions' | 'reviews'>,
): string {
  const parts = [
    plural(counts.books, 'livro', 'livros'),
    plural(counts.sessions, 'sessão', 'sessões'),
    plural(counts.reviews, 'resenha', 'resenhas'),
  ];

  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}
