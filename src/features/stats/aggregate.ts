import type { Book } from '@/features/library/types';
import { addLocalDays, toLocalDayKey } from '@/lib/day';

import { buildInsight } from './insights';
import { statsRange } from './period';
import type {
  StatsBucket,
  StatsData,
  StatsFinishedBook,
  StatsGenre,
  StatsPeriod,
  StatsRatedBook,
} from './types';

/** Máximo de gêneros antes de agrupar o resto em "Outros". */
export const GENRE_LIMIT = 5;

/** O mínimo que o agregado precisa de uma sessão (aceita `ReadingSessionRow`). */
export type StatsSession = {
  bookId: string;
  readAt: Date;
  pages: number;
  appliedPages: number | null;
};

export type StatsGenreInput = {
  id: string;
  name: string;
  colorLight: string;
};

export type StatsReviewInput = {
  bookId: string;
  rating: number;
};

export type AggregateInput = {
  period: StatsPeriod;
  today: Date;
  /** Sessões recentes o bastante para a sequência (inclui o período). */
  sessions: StatsSession[];
  /** Sessões da janela anterior, do mesmo tamanho do período. */
  previousSessions: StatsSession[];
  /** Última sessão de cada livro (data de conclusão). */
  latestPerBook: StatsSession[];
  books: Book[];
  genres: StatsGenreInput[];
  reviews: StatsReviewInput[];
};

/**
 * Páginas que entraram no progresso. Linhas anteriores à S5.1 não guardam
 * `appliedPages` e valem `pages` (mesma regra do repositório).
 */
function pagesOf(row: StatsSession): number {
  return row.appliedPages ?? row.pages;
}

function sumPages(rows: StatsSession[]): number {
  return rows.reduce((total, row) => total + pagesOf(row), 0);
}

function isWithin(date: Date, from: Date, to: Date): boolean {
  return date >= from && date <= to;
}

/**
 * Dias seguidos com leitura terminando hoje. Se hoje ainda não tem leitura,
 * ontem ainda conta como folga do dia corrente (o dia não acabou).
 */
export function currentStreak(
  sessions: { readAt: Date }[],
  today: Date,
): number {
  const days = new Set(
    sessions.map((session) => toLocalDayKey(session.readAt)),
  );
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!days.has(toLocalDayKey(cursor))) {
    cursor = addLocalDays(cursor, -1);

    if (!days.has(toLocalDayKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;

  while (days.has(toLocalDayKey(cursor))) {
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }

  return streak;
}

type GenreTotal = { id: string; pages: number; finished: number };

function toGenre(
  total: GenreTotal,
  genreById: Map<string, StatsGenreInput>,
): StatsGenre {
  const genre = genreById.get(total.id);

  return {
    id: total.id,
    name: genre?.name ?? 'Sem gênero',
    color: genre?.colorLight ?? null,
    pages: total.pages,
    finished: total.finished,
  };
}

/**
 * Números, séries e a frase do LêBot. Recebe tudo pronto e não olha banco,
 * relógio global nem React Native: o mesmo teste vale na tela e no fake.
 */
export function aggregateStats({
  period,
  today,
  sessions,
  previousSessions,
  latestPerBook,
  books,
  genres,
  reviews,
}: AggregateInput): StatsData {
  const range = statsRange(period, today);
  const bookById = new Map(books.map((book) => [book.id, book]));
  const genreById = new Map(genres.map((genre) => [genre.id, genre]));

  const inRange = sessions.filter((session) =>
    isWithin(session.readAt, range.from, range.to),
  );
  const previousInRange = previousSessions.filter((session) =>
    isWithin(session.readAt, range.previous.from, range.previous.to),
  );

  const pages = sumPages(inRange);
  const previousPages = sumPages(previousInRange);
  const activeDays = new Set(
    inRange.map((session) => toLocalDayKey(session.readAt)),
  ).size;
  const averagePerActiveDay =
    activeDays > 0 ? Math.round(pages / activeDays) : 0;

  const buckets: (StatsBucket & { pages: number })[] = range.buckets.map(
    (bucket) => ({
      ...bucket,
      pages: sumPages(
        inRange.filter((session) =>
          isWithin(session.readAt, bucket.start, bucket.end),
        ),
      ),
    }),
  );

  const genreTotals = new Map<string, GenreTotal>();

  function genreTotal(genreId: string): GenreTotal {
    const current = genreTotals.get(genreId);

    if (current) {
      return current;
    }

    const created: GenreTotal = { id: genreId, pages: 0, finished: 0 };
    genreTotals.set(genreId, created);
    return created;
  }

  for (const session of inRange) {
    // Sessão órfã conta nas páginas do período, mas não tem gênero.
    const book = bookById.get(session.bookId);

    if (book) {
      genreTotal(book.genreId).pages += pagesOf(session);
    }
  }

  const latestByBook = new Map(
    latestPerBook.map((row) => [row.bookId, row.readAt] as const),
  );

  const finished: StatsFinishedBook[] = books
    .filter((book) => book.status === 'finished')
    .map((book) => {
      const lastReadAt = latestByBook.get(book.id);

      return {
        bookId: book.id,
        title: book.title,
        genreId: book.genreId,
        at: lastReadAt ?? book.updatedAt,
        exact: lastReadAt !== undefined,
      };
    })
    .filter((book) => isWithin(book.at, range.from, range.to))
    .sort((first, second) => second.at.getTime() - first.at.getTime());

  for (const book of finished) {
    genreTotal(book.genreId).finished += 1;
  }

  const sortedGenres = [...genreTotals.values()]
    .map((total) => toGenre(total, genreById))
    .sort(
      (first, second) =>
        second.pages - first.pages ||
        second.finished - first.finished ||
        first.name.localeCompare(second.name),
    );

  const shownGenres =
    sortedGenres.length > GENRE_LIMIT
      ? [
          ...sortedGenres.slice(0, GENRE_LIMIT),
          {
            id: 'other',
            name: 'Outros',
            color: null,
            pages: sortedGenres
              .slice(GENRE_LIMIT)
              .reduce((total, genre) => total + genre.pages, 0),
            finished: sortedGenres
              .slice(GENRE_LIMIT)
              .reduce((total, genre) => total + genre.finished, 0),
          },
        ]
      : sortedGenres;

  const ratedBooks: StatsRatedBook[] = reviews
    .flatMap((review) => {
      const book = bookById.get(review.bookId);

      return book
        ? [
            {
              bookId: book.id,
              title: book.title,
              author: book.author,
              rating: review.rating,
            },
          ]
        : [];
    })
    .sort(
      (first, second) =>
        second.rating - first.rating || first.title.localeCompare(second.title),
    );

  const ratingValues = ratedBooks.map((book) => book.rating);
  const averageRating =
    ratingValues.length > 0
      ? Math.round(
          (ratingValues.reduce((total, rating) => total + rating, 0) /
            ratingValues.length) *
            10,
        ) / 10
      : null;

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: ratingValues.filter((value) => value === rating).length,
  }));

  const latestSession = sessions.reduce<Date | null>((latest, session) => {
    if (!latest || session.readAt > latest) {
      return session.readAt;
    }

    return latest;
  }, null);

  const topGenre = sortedGenres[0]
    ? {
        name: sortedGenres[0].name,
        share: pages > 0 ? sortedGenres[0].pages / pages : 0,
      }
    : null;

  const streak = currentStreak(sessions, today);

  const insight = buildInsight({
    pages,
    previousPages,
    activeDays,
    averagePerActiveDay,
    streak,
    finishedCount: finished.length,
    topGenre,
    averageRating,
    ratingCount: ratingValues.length,
    lastReadAt: latestSession,
    today,
  });

  return {
    range,
    hasData: inRange.length > 0 || finished.length > 0,
    pages,
    previousPages,
    activeDays,
    averagePerActiveDay,
    streak,
    buckets,
    genres: shownGenres,
    finished,
    ratings: {
      average: averageRating,
      count: ratingValues.length,
      distribution,
      books: ratedBooks,
    },
    insight,
    lastReadAt: latestSession,
  };
}
