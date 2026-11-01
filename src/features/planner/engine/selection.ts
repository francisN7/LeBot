import { ACTIVE_WINDOW_DAYS } from './constants';
import { daysBetween } from './day';
import type { PlannerBook, PlannerSession } from './types';

/** Páginas restantes, nunca negativas. */
export function remainingPages(book: PlannerBook): number {
  const pages = Number.isFinite(book.pages) ? Math.trunc(book.pages) : 0;
  const pagesRead = Number.isFinite(book.pagesRead)
    ? Math.trunc(book.pagesRead)
    : 0;
  return Math.max(0, pages - Math.max(0, pagesRead));
}

/** `paused` e `finished` nunca entram no plano. */
export function isEligible(book: PlannerBook): boolean {
  return (
    (book.status === 'reading' || book.status === 'queued') &&
    remainingPages(book) > 0
  );
}

function latestSessionByBook(
  sessions: readonly PlannerSession[],
): Map<string, Date> {
  const latest = new Map<string, Date>();

  for (const session of sessions) {
    if (Number.isNaN(session.readAt.getTime())) {
      continue;
    }

    const current = latest.get(session.bookId);
    if (!current || session.readAt.getTime() > current.getTime()) {
      latest.set(session.bookId, session.readAt);
    }
  }

  return latest;
}

/** Sessão mais recente do histórico, de qualquer livro. */
export function latestSession(
  sessions: readonly PlannerSession[],
): Date | undefined {
  let latest: Date | undefined;

  for (const session of sessions) {
    if (Number.isNaN(session.readAt.getTime())) {
      continue;
    }
    if (!latest || session.readAt.getTime() > latest.getTime()) {
      latest = session.readAt;
    }
  }

  return latest;
}

/**
 * Ordena pela fila: ids conhecidos primeiro, na ordem de `queueBookIds`; o
 * resto mantém a ordem recebida. Ids repetidos ou inexistentes não duplicam.
 */
export function orderByQueue(
  books: readonly PlannerBook[],
  queueBookIds: readonly string[] = [],
): PlannerBook[] {
  const position = new Map<string, number>();
  queueBookIds.forEach((id, index) => {
    if (!position.has(id)) {
      position.set(id, index);
    }
  });

  return books
    .map((book, index) => ({ book, index, queue: position.get(book.id) }))
    .sort((left, right) => {
      if (left.queue !== undefined && right.queue !== undefined) {
        return left.queue - right.queue;
      }
      if (left.queue !== undefined) {
        return -1;
      }
      if (right.queue !== undefined) {
        return 1;
      }
      return left.index - right.index;
    })
    .map(({ book }) => book);
}

type ActiveBookInput = {
  /** Já na ordem da fila; empates ficam com o primeiro. */
  books: readonly PlannerBook[];
  sessions: readonly PlannerSession[];
  today: Date;
};

/**
 * Livro `reading` com a sessão mais recente nos últimos 7 dias (hoje + 6).
 * Sem sessão recente, não há ativo: a fila decide.
 */
export function selectActiveBook({
  books,
  sessions,
  today,
}: ActiveBookInput): PlannerBook | undefined {
  const latest = latestSessionByBook(sessions);
  let active: PlannerBook | undefined;
  let activeAt = Number.NEGATIVE_INFINITY;

  for (const book of books) {
    if (book.status !== 'reading' || !isEligible(book)) {
      continue;
    }

    const readAt = latest.get(book.id);
    if (!readAt) {
      continue;
    }

    const days = daysBetween(readAt, today);
    if (days < 0 || days >= ACTIVE_WINDOW_DAYS) {
      continue;
    }

    if (readAt.getTime() > activeAt) {
      active = book;
      activeAt = readAt.getTime();
    }
  }

  return active;
}

/**
 * Primeiro livro de gênero diferente do anterior; se não houver, o primeiro.
 * `candidates` já vem na ordem da fila.
 */
export function pickNextBook(
  candidates: readonly PlannerBook[],
  previousGenreId: string | undefined,
): PlannerBook | undefined {
  if (previousGenreId === undefined) {
    return candidates[0];
  }

  return (
    candidates.find((book) => book.genreId !== previousGenreId) ?? candidates[0]
  );
}
