import type { CoverService } from '@/lib/covers';

export type FakeCoverService = CoverService & {
  /** URIs que seriam copiadas, na ordem. */
  saved: { bookId: string; sourceUri: string }[];
  /** URIs que seriam apagadas, na ordem. */
  removed: (string | null | undefined)[];
};

/**
 * Capa em memória: nada toca no disco nem na galeria. `pickedUri` define o
 * que a "galeria" devolve; `null` simula cancelamento.
 */
export function createFakeCoverService(
  pickedUri: string | null = 'file:///tmp/capa-escolhida.jpg',
): FakeCoverService {
  const saved: FakeCoverService['saved'] = [];
  const removed: FakeCoverService['removed'] = [];

  return {
    saved,
    removed,

    async pick() {
      return pickedUri
        ? { status: 'picked', uri: pickedUri }
        : { status: 'canceled' };
    },

    async save(bookId, sourceUri) {
      saved.push({ bookId, sourceUri });
      return `file:///covers/${bookId}.jpg`;
    },

    async remove(uri) {
      removed.push(uri);
    },
  };
}
