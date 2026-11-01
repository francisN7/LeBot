import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getReviewFieldsRepository,
  getReviewsRepository,
  type ReviewFieldsRepository,
  type ReviewsRepository,
  type SaveReviewInput,
} from '@/db/repositories';
import type { ReviewFieldRow, ReviewRow } from '@/db/schema';

const ReviewsRepositoryContext = createContext<ReviewsRepository | null>(null);
const ReviewFieldsRepositoryContext =
  createContext<ReviewFieldsRepository | null>(null);

/**
 * Assinaturas por repositório, no mesmo padrão de `useBooks`: salvar numa tela
 * atualiza o detalhe e a Estante sem esperar a próxima navegação.
 */
const reviewSubscribers = new WeakMap<ReviewsRepository, Set<() => void>>();
const fieldSubscribers = new WeakMap<ReviewFieldsRepository, Set<() => void>>();

function subscribe<T extends object>(
  listeners: WeakMap<T, Set<() => void>>,
  repository: T,
  listener: () => void,
): () => void {
  const set = listeners.get(repository) ?? new Set<() => void>();
  listeners.set(repository, set);
  set.add(listener);

  return () => {
    set.delete(listener);
  };
}

function notify<T extends object>(
  listeners: WeakMap<T, Set<() => void>>,
  repository: T,
): void {
  for (const listener of listeners.get(repository) ?? []) {
    listener();
  }
}

/** Injeta um repositório (produção usa o padrão; testes usam um fake). */
export function ReviewsRepositoryProvider({
  repository,
  children,
}: {
  repository: ReviewsRepository;
  children: ReactNode;
}) {
  return (
    <ReviewsRepositoryContext.Provider value={repository}>
      {children}
    </ReviewsRepositoryContext.Provider>
  );
}

/** Injeta o repositório dos campos extras configuráveis. */
export function ReviewFieldsRepositoryProvider({
  repository,
  children,
}: {
  repository: ReviewFieldsRepository;
  children: ReactNode;
}) {
  return (
    <ReviewFieldsRepositoryContext.Provider value={repository}>
      {children}
    </ReviewFieldsRepositoryContext.Provider>
  );
}

export function useReviewsRepository(): ReviewsRepository {
  const injected = useContext(ReviewsRepositoryContext);
  return injected ?? getReviewsRepository();
}

export function useReviewFieldsRepository(): ReviewFieldsRepository {
  const injected = useContext(ReviewFieldsRepositoryContext);
  return injected ?? getReviewFieldsRepository();
}

/** Resenha de um livro e as escritas do formulário e do detalhe. */
export function useReview(bookId: string) {
  const repository = useReviewsRepository();
  const [review, setReview] = useState<ReviewRow | undefined>(() =>
    repository.findByBook(bookId),
  );

  const refresh = useCallback(() => {
    setReview(repository.findByBook(bookId));
  }, [repository, bookId]);

  useEffect(
    () => subscribe(reviewSubscribers, repository, refresh),
    [repository, refresh],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    (input: Omit<SaveReviewInput, 'bookId'>) => {
      const row = repository.save({ ...input, bookId });
      notify(reviewSubscribers, repository);
      return row;
    },
    [bookId, repository],
  );

  const remove = useCallback(() => {
    const removed = repository.remove(bookId);
    notify(reviewSubscribers, repository);
    return removed;
  }, [bookId, repository]);

  return { review, save, remove, refresh, repository };
}

/** Todas as resenhas, indexadas por livro (selo da Estante). */
export function useReviews() {
  const repository = useReviewsRepository();
  const [rows, setRows] = useState<ReviewRow[]>(() => repository.list());

  const refresh = useCallback(() => {
    setRows(repository.list());
  }, [repository]);

  useEffect(
    () => subscribe(reviewSubscribers, repository, refresh),
    [repository, refresh],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  const byBook = useMemo(
    () => new Map(rows.map((row) => [row.bookId, row] as const)),
    [rows],
  );

  return { reviews: rows, byBook, refresh, repository };
}

/** Campos extras globais, na ordem dos chips da resenha. */
export function useReviewFields() {
  const repository = useReviewFieldsRepository();
  const reviewsRepository = useReviewsRepository();
  const [fields, setFields] = useState<ReviewFieldRow[]>(() =>
    repository.list(),
  );

  const refresh = useCallback(() => {
    setFields(repository.list());
  }, [repository]);

  useEffect(
    () => subscribe(fieldSubscribers, repository, refresh),
    [repository, refresh],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    (name: string) => {
      const row = repository.create({ name });
      notify(fieldSubscribers, repository);
      return row;
    },
    [repository],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const row = repository.rename(id, name);
      notify(fieldSubscribers, repository);
      return row;
    },
    [repository],
  );

  const remove = useCallback(
    (id: string) => {
      const removed = repository.remove(id);
      notify(fieldSubscribers, repository);
      // Excluir o campo também tira o valor das resenhas.
      notify(reviewSubscribers, reviewsRepository);
      return removed;
    },
    [repository, reviewsRepository],
  );

  return { fields, create, rename, remove, refresh, repository };
}
