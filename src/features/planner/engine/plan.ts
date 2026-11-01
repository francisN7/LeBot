import {
  ACTIVE_BOOK_CAP_PERCENT,
  CAP_MIN_GOAL_PAGES,
  LIGHT_DAY_AFTER_DAYS,
  LIGHT_DAY_PERCENT,
  MAX_GOAL_PAGES,
  MIN_GOAL_PAGES,
} from './constants';
import { daysBetween, toLocalDayKey } from './day';
import { atLeastOnePage, percentOf } from './rounding';
import {
  isEligible,
  latestSession,
  orderByQueue,
  pickNextBook,
  remainingPages,
  selectActiveBook,
} from './selection';
import type { Plan, PlanEntry, PlannerBook, PlannerInput } from './types';

/** Limita a meta configurada; valor inválido cai no mínimo. */
export function clampGoal(goalPages: number): number {
  if (!Number.isFinite(goalPages)) {
    return MIN_GOAL_PAGES;
  }

  return Math.min(
    MAX_GOAL_PAGES,
    Math.max(MIN_GOAL_PAGES, Math.trunc(goalPages)),
  );
}

function makeEntry(
  book: PlannerBook,
  pages: number,
  source: PlanEntry['source'],
  suggestion: boolean,
): PlanEntry {
  return {
    bookId: book.id,
    pages,
    source,
    finishes: pages >= remainingPages(book),
    suggestion,
  };
}

/**
 * Completa o que sobrou da meta no último livro com páginas disponíveis. O
 * teto de 60% é uma preferência: sem outro livro para receber a sobra, o ativo
 * (ou o último bloco) pode passar dele para o dia não ficar pela metade.
 */
function fillLeftover(
  entries: PlanEntry[],
  books: readonly PlannerBook[],
  left: number,
): void {
  if (left <= 0) {
    return;
  }

  const withCapacity = entries.flatMap((entry) => {
    const book = books.find((candidate) => candidate.id === entry.bookId);
    return book && remainingPages(book) > entry.pages ? [{ entry, book }] : [];
  });

  const target =
    withCapacity.find(({ entry }) => entry.source === 'active') ??
    withCapacity[withCapacity.length - 1];

  if (!target) {
    return;
  }

  const extra = Math.min(
    left,
    remainingPages(target.book) - target.entry.pages,
  );

  if (extra <= 0) {
    return;
  }

  target.entry.pages += extra;
  target.entry.finishes = target.entry.pages >= remainingPages(target.book);
}

export function buildPlan(input: PlannerInput): Plan {
  const baseGoal = clampGoal(input.goalPages);
  const lastSession = latestSession(input.sessions);
  const lightDay =
    lastSession !== undefined &&
    daysBetween(lastSession, input.today) >= LIGHT_DAY_AFTER_DAYS;
  const goal = lightDay
    ? atLeastOnePage(percentOf(baseGoal, LIGHT_DAY_PERCENT))
    : baseGoal;

  const ordered = orderByQueue(input.books, input.queueBookIds ?? []);
  const eligible = ordered.filter(isEligible);
  const active = selectActiveBook({
    books: ordered,
    sessions: input.sessions,
    today: input.today,
  });

  const base = {
    date: toLocalDayKey(input.today),
    baseGoal,
    goal,
    lightDay,
  };

  if (eligible.length === 0) {
    return { ...base, pages: 0, entries: [], emptyReason: 'no-books' };
  }

  const hasActive = active !== undefined;
  // Meta pequena não é dividida: um livro leva o dia inteiro.
  const cap =
    hasActive && goal >= CAP_MIN_GOAL_PAGES
      ? atLeastOnePage(percentOf(goal, ACTIVE_BOOK_CAP_PERCENT))
      : goal;
  const entries: PlanEntry[] = [];
  let left = goal;

  if (active) {
    const pages = Math.min(cap, remainingPages(active), left);

    if (pages > 0) {
      entries.push(makeEntry(active, pages, 'active', false));
      left -= pages;
    }
  }

  const available = eligible.filter((book) => book.id !== active?.id);
  let previousGenreId = active?.genreId;

  while (left > 0 && available.length > 0) {
    const next = pickNextBook(available, previousGenreId);
    if (!next) {
      break;
    }

    const index = available.indexOf(next);
    if (index >= 0) {
      available.splice(index, 1);
    }

    const pages = Math.min(cap, remainingPages(next), left);
    if (pages <= 0) {
      continue;
    }

    entries.push(makeEntry(next, pages, 'queue', hasActive));
    left -= pages;
    previousGenreId = next.genreId;
  }

  fillLeftover(entries, eligible, left);

  return {
    ...base,
    pages: entries.reduce((total, entry) => total + entry.pages, 0),
    entries,
    emptyReason: null,
  };
}
