import type { ReadingStatus } from './types';

/** Ordem da roda de status, de "Lendo" a "Concluído". */
export const statusWheelOrder: readonly ReadingStatus[] = [
  'reading',
  'queued',
  'paused',
  'finished',
];

/**
 * Converte o offset da roda no status central. O arredondamento faz o item mais
 * próximo vencer e o clamp impede que o overscroll das pontas devolva
 * `undefined`.
 */
export function statusFromOffset(
  offset: number,
  itemHeight: number,
  statuses: readonly ReadingStatus[] = statusWheelOrder,
): ReadingStatus {
  const first = statuses[0];

  if (!first) {
    throw new Error('A roda de status precisa de pelo menos um status');
  }

  if (
    !Number.isFinite(offset) ||
    !Number.isFinite(itemHeight) ||
    itemHeight <= 0
  ) {
    return first;
  }

  const index = Math.round(offset / itemHeight);
  const clamped = Math.min(Math.max(index, 0), statuses.length - 1);

  return statuses[clamped] ?? first;
}

/** Offset que centraliza um status na roda (usado na posição inicial e no a11y). */
export function offsetForStatus(
  status: ReadingStatus,
  itemHeight: number,
  statuses: readonly ReadingStatus[] = statusWheelOrder,
): number {
  const index = statuses.indexOf(status);

  return Math.max(index, 0) * itemHeight;
}
