import type { Book } from '@/features/library/types';
import { DEFAULT_GOAL_PAGES, type Plan } from '@/features/planner';
import type { ReadingSession } from '@/features/reading/types';

import { formatReadTime, formatTodayLabel } from './format';
import type {
  DailyPlanView,
  PlanBlock,
  PlanBlockStatus,
  TodaySession,
} from './types';

/** Valor usado quando `goal.pages` ainda não existe em `settings`. */
export const FALLBACK_GOAL_PAGES = DEFAULT_GOAL_PAGES;

/**
 * Lê a meta de `settings`. Texto vazio ou não numérico cai no padrão da seed;
 * fora de 3–200 quem limita é o motor (`clampGoal`).
 */
export function readGoalPages(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return FALLBACK_GOAL_PAGES;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : FALLBACK_GOAL_PAGES;
}

function isSameLocalDay(one: Date, other: Date): boolean {
  return (
    one.getFullYear() === other.getFullYear() &&
    one.getMonth() === other.getMonth() &&
    one.getDate() === other.getDate()
  );
}

type BuildPlanViewInput = {
  plan: Plan;
  books: readonly Book[];
  sessions: readonly ReadingSession[];
  today: Date;
};

/**
 * Cruza o plano bruto do motor com o estado real do dia. O motor não desconta
 * as páginas de hoje; aqui cada bloco ganha o quanto já foi lido e o estado
 * feito/agora/depois. Nenhuma regra do plano é refeita: meta, blocos e
 * sugestão vêm do `Plan`.
 */
export function buildPlanView({
  plan,
  books,
  sessions,
  today,
}: BuildPlanViewInput): DailyPlanView {
  const booksById = new Map(books.map((book) => [book.id, book]));
  const pagesTodayByBook = new Map<string, number>();
  const logged: { session: ReadingSession; book: Book }[] = [];
  let pagesToday = 0;

  for (const session of sessions) {
    if (!isSameLocalDay(session.readAt, today)) {
      continue;
    }

    pagesToday += session.appliedPages;
    pagesTodayByBook.set(
      session.bookId,
      (pagesTodayByBook.get(session.bookId) ?? 0) + session.appliedPages,
    );

    // Sessão órfã (livro excluído) conta na meta, mas não tem o que listar.
    const book = booksById.get(session.bookId);

    if (book) {
      logged.push({ session, book });
    }
  }

  const sessionsToday: TodaySession[] = logged
    .sort(
      (first, second) =>
        first.session.readAt.getTime() - second.session.readAt.getTime() ||
        first.session.id.localeCompare(second.session.id),
    )
    .map(({ session, book }) => ({
      id: session.id,
      bookId: book.id,
      bookTitle: book.title,
      appliedPages: session.appliedPages,
      timeLabel: formatReadTime(session.readAt),
    }));

  const blocks: PlanBlock[] = [];

  for (const entry of plan.entries) {
    const book = booksById.get(entry.bookId);

    if (!book) {
      continue;
    }

    const readToday = pagesTodayByBook.get(book.id) ?? 0;
    const done = readToday >= entry.pages || book.pagesRead >= book.pages;

    blocks.push({
      book,
      pages: entry.pages,
      suggestion: entry.suggestion,
      finishes: entry.finishes,
      pagesToday: readToday,
      status: done ? 'done' : 'later',
    });
  }

  // O bloco principal pendente é o "agora"; a sugestão só vira agora se o
  // principal já estiver feito.
  let nextIndex = blocks.findIndex(
    (block) => block.status !== 'done' && !block.suggestion,
  );

  if (nextIndex < 0) {
    nextIndex = blocks.findIndex((block) => block.status !== 'done');
  }

  const withStatus: PlanBlock[] = blocks.map((block, index) => {
    const status: PlanBlockStatus =
      block.status === 'done' ? 'done' : index === nextIndex ? 'now' : 'later';

    return { ...block, status };
  });

  const next = nextIndex >= 0 ? withStatus[nextIndex] : undefined;
  const allDone =
    withStatus.length > 0 &&
    withStatus.every((block) => block.status === 'done');

  let message = 'Sem blocos para hoje.';

  if (plan.emptyReason === 'no-books') {
    message =
      'Nenhum livro com páginas restantes. Ajuste a ordem ou comece um.';
  } else if (allDone) {
    message = 'Meta do dia batida. O resto é bônus.';
  } else if (plan.lightDay) {
    message = `Voltando com calma: hoje são ${plan.goal} páginas.`;
  } else if (next) {
    message = `Comece por ${next.book.title}.`;
  }

  const mascot = plan.emptyReason
    ? 'sleepy'
    : allDone
      ? 'celebrating'
      : plan.lightDay
        ? 'sleepy'
        : 'reading';

  return {
    dateLabel: formatTodayLabel(today),
    goal: plan.goal,
    baseGoal: plan.baseGoal,
    lightDay: plan.lightDay,
    empty: plan.emptyReason !== null,
    pagesToday,
    sessionsToday,
    blocks: withStatus,
    message,
    mascot,
  };
}
