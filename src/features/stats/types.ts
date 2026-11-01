/** Períodos do seletor de "Meu ritmo". */
export const statsPeriods = ['4w', '12w', 'year'] as const;

export type StatsPeriod = (typeof statsPeriods)[number];

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

/** Fatia do gráfico de ritmo (uma semana ou um mês). */
export type StatsBucket = {
  /** Chave estável para listas. */
  key: string;
  /** Rótulo curto embaixo da barra (`12/10` ou `out`). */
  label: string;
  /** Descrição longa para o leitor de tela. */
  description: string;
  start: Date;
  end: Date;
};

export type StatsRange = {
  period: StatsPeriod;
  /** "Últimas 4 semanas". */
  label: string;
  from: Date;
  to: Date;
  /** Janela do mesmo tamanho imediatamente anterior, para comparar ritmo. */
  previous: { from: Date; to: Date };
  buckets: StatsBucket[];
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
  /** `false` quando a data veio de `books.updatedAt` (conclusão sem sessão). */
  exact: boolean;
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
  };
  insight: StatsInsight;
  lastReadAt: Date | null;
};
