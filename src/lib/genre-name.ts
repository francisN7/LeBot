import { normalizeText } from './book-search';

/** Nome comparável: sem acento, caixa baixa e espaços repetidos. */
export function normalizeGenreName(name: string): string {
  return normalizeText(name).replace(/\s+/g, ' ');
}
