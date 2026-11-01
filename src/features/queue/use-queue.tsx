import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getQueueRepository, type QueueRepository } from '@/db/repositories';
import type { QueueItemRow } from '@/db/schema';

import { toQueueItem } from './types';

const QueueRepositoryContext = createContext<QueueRepository | null>(null);

/**
 * Assinaturas por repositório, no padrão de `useBooks`: reordenar numa tela
 * atualiza a Hoje e qualquer outra tela que leia a mesma ordem.
 */
const subscribers = new WeakMap<QueueRepository, Set<() => void>>();

function subscribe(repository: QueueRepository, listener: () => void) {
  const listeners = subscribers.get(repository) ?? new Set<() => void>();
  subscribers.set(repository, listeners);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notify(repository: QueueRepository): void {
  for (const listener of subscribers.get(repository) ?? []) {
    listener();
  }
}

/** Injeta um repositório (produção usa o padrão; testes usam um fake). */
export function QueueRepositoryProvider({
  repository,
  children,
}: {
  repository: QueueRepository;
  children: ReactNode;
}) {
  return (
    <QueueRepositoryContext.Provider value={repository}>
      {children}
    </QueueRepositoryContext.Provider>
  );
}

export function useQueueRepository(): QueueRepository {
  const injected = useContext(QueueRepositoryContext);
  return injected ?? getQueueRepository();
}

/**
 * Ordem do dono com as escritas que a tela usa. Adicionar, remover e reordenar
 * não tocam no status do livro: quem registra leitura é a Hoje (S7.1).
 */
export function useQueue() {
  const repository = useQueueRepository();
  const [rows, setRows] = useState<QueueItemRow[]>(() => repository.list());

  const refresh = useCallback(() => {
    setRows(repository.list());
  }, [repository]);

  useEffect(() => subscribe(repository, refresh), [repository, refresh]);

  const add = useCallback(
    (bookId: string) => {
      const row = repository.add(bookId);
      notify(repository);
      return row;
    },
    [repository],
  );

  const remove = useCallback(
    (bookId: string) => {
      const removed = repository.remove(bookId);
      notify(repository);
      return removed;
    },
    [repository],
  );

  const move = useCallback(
    (bookId: string, toPosition: number) => {
      const next = repository.move(bookId, toPosition);
      notify(repository);
      return next;
    },
    [repository],
  );

  const replaceAll = useCallback(
    (bookIds: readonly string[]) => {
      const next = repository.replaceAll(bookIds);
      notify(repository);
      return next;
    },
    [repository],
  );

  const items = useMemo(() => rows.map(toQueueItem), [rows]);
  const bookIds = useMemo(() => items.map((item) => item.bookId), [items]);

  return { items, bookIds, add, remove, move, replaceAll, refresh, repository };
}

/**
 * Ids na ordem definida pelo dono, que o motor do plano usa para desempatar e
 * escolher o próximo livro. A Hoje não sabe de onde eles vêm.
 */
export function useQueueBookIds(): string[] {
  return useQueue().bookIds;
}
