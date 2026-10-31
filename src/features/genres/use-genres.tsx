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
  CreateGenreInput,
  GenrePatch,
  GenresRepository,
} from '@/db/repositories';
import { getGenresRepository } from '@/db/repositories';
import type { GenreRow } from '@/db/schema';

import { type Genre, toGenre } from './types';

const GenresRepositoryContext = createContext<GenresRepository | null>(null);

/**
 * Assinaturas por repositório: quando uma tela grava, as outras que usam o
 * mesmo repositório recarregam a lista (mesmo padrão de `useBooks`).
 */
const subscribers = new WeakMap<GenresRepository, Set<() => void>>();

function subscribe(repository: GenresRepository, listener: () => void) {
  const listeners = subscribers.get(repository) ?? new Set<() => void>();
  subscribers.set(repository, listeners);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notify(repository: GenresRepository): void {
  for (const listener of subscribers.get(repository) ?? []) {
    listener();
  }
}

/** Injeta um repositório (produção usa o padrão; testes usam um fake). */
export function GenresRepositoryProvider({
  repository,
  children,
}: {
  repository: GenresRepository;
  children: ReactNode;
}) {
  return (
    <GenresRepositoryContext.Provider value={repository}>
      {children}
    </GenresRepositoryContext.Provider>
  );
}

export function useGenresRepository(): GenresRepository {
  const injected = useContext(GenresRepositoryContext);
  return injected ?? getGenresRepository();
}

/** Gêneros do aparelho com as escritas que a estante e o formulário usam. */
export function useGenres() {
  const repository = useGenresRepository();
  const [rows, setRows] = useState<GenreRow[]>(() => repository.list());

  const refresh = useCallback(() => {
    setRows(repository.list());
  }, [repository]);

  useEffect(() => subscribe(repository, refresh), [repository, refresh]);

  const create = useCallback(
    (input: CreateGenreInput) => {
      const row = repository.create(input);
      notify(repository);
      return row;
    },
    [repository],
  );

  const update = useCallback(
    (id: string, patch: GenrePatch) => {
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

  const genres = useMemo(() => rows.map(toGenre), [rows]);
  const genreById = useMemo(
    () => new Map<string, Genre>(genres.map((genre) => [genre.id, genre])),
    [genres],
  );

  return { genres, genreById, create, update, remove, refresh, repository };
}
