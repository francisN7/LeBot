/** Períodos do seletor de "Meu ritmo". */
export const statsPeriods = ['1w', '1m', '3m', '1y'] as const;

export type StatsPeriod = (typeof statsPeriods)[number];

/** Granularidade das barras de ritmo. */
export type StatsUnit = 'day' | 'week' | 'month';

/**
 * Humor do LêBot na tela. Os nomes são os mesmos de `MascotState`, mas o
 * agregado é puro e não importa React Native, então o tipo mora aqui.
 */
export type StatsMood =
  | 'neutral'
  | 'reading'
  | 'happy'
  | 'sleepy'
  | 'thinking'
  | 'celebrating';

/** Fatia do gráfico de ritmo (um dia, uma semana ou um mês). */
export type StatsBucket = {
  /** Chave estável para listas. */
  key: string;
  /** Rótulo curto embaixo da barra (`seg`, `5/10`, `12` ou `out`). */
  label: string;
  /** Descrição longa para o leitor de tela. */
  description: string;
  start: Date;
  end: Date;
};

export type StatsRange = {
  period: StatsPeriod;
  /** "Último mês". */
  label: string;
  /** Cada barra é um dia, uma semana ou um mês. */
  unit: StatsUnit;
  from: Date;
  to: Date;
  /** Janela do mesmo tamanho imediatamente anterior, para comparar ritmo. */
  previous: { from: Date; to: Date };
  buckets: StatsBucket[];
  /** Chave do dia/semana/mês de hoje, destacada no gráfico. */
  currentKey: string;
};

export type StatsGenre = {
  id: string;
  name: string;
  /** Cor do gênero; `null` quando o gênero foi excluído. */
  color: string | null;
  pages: number;
  finished: number;
};

export type StatsFinishedBook = {
  bookId: string;
  title: string;
  genreId: string;
  at: Date;
  /** `false` quando a data veio de `books.updated_at` (conclusão sem sessão). */
  exact: boolean;
};

export type StatsRatedBook = {
  bookId: string;
  title: string;
  author: string;
  rating: number;
};

export type StatsRatingBucket = {
  rating: number;
  count: number;
};

export type StatsInsight = {
  text: string;
  mood: StatsMood;
};

export type StatsData = {
  range: StatsRange;
  hasData: boolean;
  pages: number;
  previousPages: number;
  activeDays: number;
  averagePerActiveDay: number;
  /** Dias seguidos com leitura, contando hoje ou ontem como folga. */
  streak: number;
  buckets: (StatsBucket & { pages: number })[];
  genres: StatsGenre[];
  finished: StatsFinishedBook[];
  ratings: {
    average: number | null;
    count: number;
    distribution: StatsRatingBucket[];
    /** Todos os livros com resenha, para o drill-down por nota. */
    books: StatsRatedBook[];
  };
  insight: StatsInsight;
  lastReadAt: Date | null;
};
