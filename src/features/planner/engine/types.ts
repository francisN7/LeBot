/** Status que o motor entende; espelha `ReadingStatus` do banco. */
export type PlannerBookStatus = 'reading' | 'queued' | 'paused' | 'finished';

/** Livro visto pelo motor: só o necessário para escolher e dividir páginas. */
export type PlannerBook = {
  id: string;
  /** `genres.id`; usado só para alternar gêneros. */
  genreId: string;
  status: PlannerBookStatus;
  /** Total de páginas do livro. */
  pages: number;
  /** Páginas já lidas; o motor nunca planeja além de `pages - pagesRead`. */
  pagesRead: number;
};

/** Sessão de leitura vista pelo motor; só o dia importa. */
export type PlannerSession = {
  bookId: string;
  /** Momento da leitura; o motor considera o dia local. */
  readAt: Date;
};

export type PlannerInput = {
  /** Dia de referência. O motor não lê o relógio global. */
  today: Date;
  /** Meta configurada; é limitada a 3–200. */
  goalPages: number;
  books: readonly PlannerBook[];
  /** Histórico recente; sessões antigas não atrapalham. */
  sessions: readonly PlannerSession[];
  /**
   * Ordem da fila. A S7 passa a fila atual; a S8, a fila real. Sem a lista,
   * vale a ordem de `books`.
   */
  queueBookIds?: readonly string[];
};

/** De onde o livro veio: o ativo ou o resto da fila/estante. */
export type PlanEntrySource = 'active' | 'queue';

export type PlanEntry = {
  bookId: string;
  /** Páginas a ler hoje neste livro; nunca 0. */
  pages: number;
  source: PlanEntrySource;
  /** O plano cobre todo o restante do livro. */
  finishes: boolean;
  /**
   * Leitura paralela opcional. Só aparece quando há um livro ativo: os demais
   * blocos são sugestões para alternar gênero, não cobranças.
   */
  suggestion: boolean;
};

export type Plan = {
  /** Dia local no formato `YYYY-MM-DD`. */
  date: string;
  /** Meta pedida, já limitada a 3–200. */
  baseGoal: number;
  /** Meta do dia depois da volta leve. */
  goal: number;
  /** Soma de `entries`; nunca passa de `goal`. */
  pages: number;
  entries: PlanEntry[];
  /** A última sessão foi há 3+ dias: meta reduzida a 70%. */
  lightDay: boolean;
  /** `no-books` quando não há livro elegível com páginas restantes. */
  emptyReason: 'no-books' | null;
};
