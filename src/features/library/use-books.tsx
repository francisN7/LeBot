import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  BookPatch,
  BooksRepository,
  CreateBookInput,
} from '@/db/repositories';
import { getBooksRepository } from '@/db/repositories';
import type { BookRow } from '@/db/schema';

import type { Book } from './types';

const BooksRepositoryContext = createContext<BooksRepository | null>(null);

/**
 * Assinaturas por repositório: quando uma tela grava, as outras que usam o
 * mesmo repositório recarregam a lista. Sem isso, voltar do formulário
 * mostraria dados velhos.
 */
const subscribers = new WeakMap<BooksRepository, Set<() => void>>();

function subscribe(repository: BooksRepository, listener: () => void) {
  const listeners = subscribers.get(repository) ?? new Set<() => void>();
  subscribers.set(repository, listeners);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notify(repository: BooksRepository): void {
  for (const listener of subscribers.get(repository) ?? []) {
    listener();
  }
}

/**
 * Avisa quem usa o livro que o progresso mudou (ex.: `reading` gravou uma
 * sessão). As telas recarregam sem esperar a próxima navegação.
 */
export function notifyBooksChanged(repository: BooksRepository): void {
  notify(repository);
}

/** Injeta um repositório (produção usa o padrão; testes usam um fake). */
export function BooksRepositoryProvider({
  repository,
  children,
}: {
  repository: BooksRepository;
  children: ReactNode;
}) {
  return (
    <BooksRepositoryContext.Provider value={repository}>
      {children}
    </BooksRepositoryContext.Provider>
  );
}

export function useBooksRepository(): BooksRepository {
  const injected = useContext(BooksRepositoryContext);
  return injected ?? getBooksRepository();
}

export function toBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genreId: row.genreId,
    status: row.status,
    pages: row.pages,
    pagesRead: row.pagesRead,
    isbn: row.isbn,
    coverUri: row.coverUri,
    updatedAt: row.updatedAt,
  };
}

/** Livros da estante com as escritas que o formulário e o detalhe usam. */
export function useBooks() {
  const repository = useBooksRepository();
  const [rows, setRows] = useState<BookRow[]>(() => repository.list());

  const refresh = useCallback(() => {
    setRows(repository.list());
  }, [repository]);

  useEffect(() => subscribe(repository, refresh), [repository, refresh]);

  const create = useCallback(
    (input: CreateBookInput) => {
      const row = repository.create(input);
      notify(repository);
      return row;
    },
    [repository],
  );

  const update = useCallback(
    (id: string, patch: BookPatch) => {
      const row = repository.update(id, patch);
      notify(repository);
      return row;
    },
    [repository],
  );

  const remove = useCallback(
    (id: string) => {
      const removed = repository.remove(id);
      notify(repository);
      return removed;
    },
    [repository],
  );

  const books = useMemo(() => rows.map(toBook), [rows]);

  return { books, create, update, remove, refresh, repository };
}
