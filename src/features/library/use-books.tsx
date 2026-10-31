import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { BooksRepository } from '@/db/repositories';
import { getBooksRepository } from '@/db/repositories';
import type { BookRow } from '@/db/schema';

import type { Book } from './types';

const BooksRepositoryContext = createContext<BooksRepository | null>(null);

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
    genre: row.genre,
    status: row.status,
    pages: row.pages,
    pagesRead: row.pagesRead,
  };
}

/** Livros da estante com uma função para recarregar depois de escrever. */
export function useBooks() {
  const repository = useBooksRepository();
  const [rows, setRows] = useState<BookRow[]>(() => repository.list());

  const refresh = useCallback(() => {
    setRows(repository.list());
  }, [repository]);

  const books = useMemo(() => rows.map(toBook), [rows]);

  return { books, refresh, repository };
}
