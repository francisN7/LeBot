import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  type CreateReadingSessionInput,
  getReadingSessionsRepository,
  type ReadingSessionsRepository,
} from '@/db/repositories';
import {
  notifyBooksChanged,
  useBooksRepository,
} from '@/features/library/use-books';

import { type ReadingSession, toReadingSession } from './types';

const ReadingSessionsRepositoryContext =
  createContext<ReadingSessionsRepository | null>(null);

/**
 * Assinaturas por repositório, no mesmo padrão de `useBooks`: registrar numa
 * tela atualiza as outras que mostram o mesmo livro.
 */
const subscribers = new WeakMap<ReadingSessionsRepository, Set<() => void>>();

function subscribe(
  repository: ReadingSessionsRepository,
  listener: () => void,
) {
  const listeners = subscribers.get(repository) ?? new Set<() => void>();
  subscribers.set(repository, listeners);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Avisa um hook sempre que uma sessão é gravada ou desfeita no repositório. */
export function subscribeToReadingSessions(
  repository: ReadingSessionsRepository,
  listener: () => void,
): () => void {
  return subscribe(repository, listener);
}

function notify(repository: ReadingSessionsRepository): void {
  for (const listener of subscribers.get(repository) ?? []) {
    listener();
  }
}

/** Injeta um repositório (produção usa o padrão; testes usam um fake). */
export function ReadingSessionsRepositoryProvider({
  repository,
  children,
}: {
  repository: ReadingSessionsRepository;
  children: ReactNode;
}) {
  return (
    <ReadingSessionsRepositoryContext.Provider value={repository}>
      {children}
    </ReadingSessionsRepositoryContext.Provider>
  );
}

export function useReadingSessionsRepository(): ReadingSessionsRepository {
  const injected = useContext(ReadingSessionsRepositoryContext);
  return injected ?? getReadingSessionsRepository();
}

/**
 * Sessões de um livro e as escritas que o detalhe e a Hoje usam.
 * Toda escrita avisa `useBooks`, então o progresso aparece na hora.
 */
export function useReadingSessions(bookId: string) {
  const repository = useReadingSessionsRepository();
  const booksRepository = useBooksRepository();
  const [sessions, setSessions] = useState<ReadingSession[]>(() =>
    repository.listByBook(bookId).map(toReadingSession),
  );

  const refresh = useCallback(() => {
    setSessions(repository.listByBook(bookId).map(toReadingSession));
  }, [repository, bookId]);

  useEffect(() => subscribe(repository, refresh), [repository, refresh]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = useCallback(
    (pages: number, readAt?: Date) => {
      const input: CreateReadingSessionInput = { bookId, pages, readAt };
      const write = repository.create(input);
      notify(repository);
      notifyBooksChanged(booksRepository);
      return write;
    },
    [bookId, booksRepository, repository],
  );

  const undo = useCallback(
    (sessionId: string) => {
      const removal = repository.remove(sessionId);
      notify(repository);
      notifyBooksChanged(booksRepository);
      return removal;
    },
    [booksRepository, repository],
  );

  return { sessions, register, undo, refresh, repository };
}
