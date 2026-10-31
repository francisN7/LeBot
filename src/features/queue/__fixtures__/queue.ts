import type { QueueItem } from '../types';

/** Fila fictícia da S1: ordem manual, sem motor anti-ressaca ainda. */
export const queue: QueueItem[] = [
  {
    bookId: 'book-orgulho',
    note: 'Clássico leve para alternar com a não-ficção',
    plannedPages: 20,
  },
  {
    bookId: 'book-coraline',
    note: 'Retomada curta depois do Hobbit',
    plannedPages: 15,
  },
];
