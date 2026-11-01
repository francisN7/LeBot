import type { QueueItemRow } from '@/db/schema';

/** Item da ordem como a UI enxerga; a posição é sempre 0..n-1. */
export type QueueItem = {
  bookId: string;
  position: number;
  note: string | null;
};

export function toQueueItem(row: QueueItemRow): QueueItem {
  return {
    bookId: row.bookId,
    position: row.position,
    note: row.note,
  };
}
