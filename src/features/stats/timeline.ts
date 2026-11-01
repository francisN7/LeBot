import type { Book } from '@/features/library/types';
import { toLocalDayKey } from '@/lib/day';

import type { StatsSession } from './aggregate';
import { longMonth, shortMonth } from './period';

export type TimelineMonth = {
  key: string;
  label: string;
  description: string;
  pages: number;
  /** `true` no mês corrente; o gráfico destaca em dourado. */
  current: boolean;
};

export type TimelineYear = {
  year: number;
  pages: number;
  activeDays: number;
  finished: number;
  months: TimelineMonth[];
};

export type TimelineData = {
  /** Primeira sessão registrada; `null` quando não há leitura. */
  from: Date | null;
  pages: number;
  activeDays: number;
  finished: number;
  monthsWithReading: number;
  /** Anos em ordem decrescente (o atual primeiro). */
  years: TimelineYear[];
};

export type TimelineInput = {
  today: Date;
  sessions: StatsSession[];
  books: Pick<Book, 'id' | 'status' | 'updatedAt'>[];
  latestPerBook: StatsSession[];
};

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function pagesOf(row: StatsSession): number {
  return row.appliedPages ?? row.pages;
}

/**
 * Todo o histórico, sem janela: totais desde a primeira sessão e uma grade
 * jan→dez por ano. Sessão órfã conta páginas; livro concluído sem sessão usa
 * `updated_at` como data (mesma regra das estatísticas).
 */
export function buildTimeline({
  today,
  sessions,
  books,
  latestPerBook,
}: TimelineInput): TimelineData {
  const pagesByMonth = new Map<string, number>();
  const activeDays = new Set<string>();
  const activeDaysByYear = new Map<number, Set<string>>();

  for (const session of sessions) {
    const key = monthKey(
      session.readAt.getFullYear(),
      session.readAt.getMonth(),
    );
    pagesByMonth.set(key, (pagesByMonth.get(key) ?? 0) + pagesOf(session));

    const day = toLocalDayKey(session.readAt);
    activeDays.add(day);

    const year = session.readAt.getFullYear();
    const yearDays = activeDaysByYear.get(year) ?? new Set<string>();
    yearDays.add(day);
    activeDaysByYear.set(year, yearDays);
  }

  const latest = new Map(
    latestPerBook.map((row) => [row.bookId, row.readAt] as const),
  );
  const finishedByYear = new Map<number, number>();
  const finishedDates: Date[] = [];

  for (const book of books) {
    if (book.status !== 'finished') {
      continue;
    }

    const at = latest.get(book.id) ?? book.updatedAt;
    finishedDates.push(at);
    finishedByYear.set(
      at.getFullYear(),
      (finishedByYear.get(at.getFullYear()) ?? 0) + 1,
    );
  }

  // Com leituras, a linha do tempo começa na primeira sessão. Sem sessões, o
  // começo é o livro concluído mais antigo (conclusão pela roda/edição).
  const from =
    sessions[0]?.readAt ??
    finishedDates.sort(
      (first, second) => first.getTime() - second.getTime(),
    )[0] ??
    null;
  const firstYear = [from?.getFullYear(), ...finishedByYear.keys()].filter(
    (year): year is number => year !== undefined,
  );

  if (firstYear.length === 0) {
    return {
      from,
      pages: 0,
      activeDays: 0,
      finished: 0,
      monthsWithReading: 0,
      years: [],
    };
  }

  const startYear = Math.min(...firstYear);
  const currentYear = today.getFullYear();
  const years: TimelineYear[] = [];

  for (let year = currentYear; year >= startYear; year -= 1) {
    const months = Array.from({ length: 12 }, (_, month): TimelineMonth => {
      const pages = pagesByMonth.get(monthKey(year, month)) ?? 0;
      const date = new Date(year, month, 1);

      return {
        key: monthKey(year, month),
        label: shortMonth(date),
        description: `${longMonth(date)} de ${year}`,
        pages,
        current: year === currentYear && month === today.getMonth(),
      };
    });

    years.push({
      year,
      pages: months.reduce((total, month) => total + month.pages, 0),
      activeDays: activeDaysByYear.get(year)?.size ?? 0,
      finished: finishedByYear.get(year) ?? 0,
      months,
    });
  }

  return {
    from,
    pages: sessions.reduce((total, session) => total + pagesOf(session), 0),
    activeDays: activeDays.size,
    finished: [...finishedByYear.values()].reduce(
      (total, count) => total + count,
      0,
    ),
    monthsWithReading: [...pagesByMonth.values()].filter((pages) => pages > 0)
      .length,
    years,
  };
}
