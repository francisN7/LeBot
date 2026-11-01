import type { MascotState } from '@/components/ui/Mascot';
import type { Book } from '@/features/library/types';

export type PlanBlockStatus = 'done' | 'now' | 'later';

export type PlanBlock = {
  book: Book;
  /** Páginas que o motor reservou para hoje neste livro. */
  pages: number;
  /** Bloco paralelo ao ativo: é uma opção, não uma cobrança. */
  suggestion: boolean;
  /** O bloco fecha o livro. */
  finishes: boolean;
  /** Páginas já registradas hoje neste livro. */
  pagesToday: number;
  status: PlanBlockStatus;
};

/** Sessão de hoje já pronta para a lista "Lido hoje". */
export type TodaySession = {
  id: string;
  bookId: string;
  bookTitle: string;
  /** Páginas que entraram no progresso. */
  appliedPages: number;
  /** Hora local no formato `HH:mm`. */
  timeLabel: string;
};

/** Plano do dia já cruzado com os livros e as sessões de hoje. */
export type DailyPlanView = {
  dateLabel: string;
  goal: number;
  baseGoal: number;
  lightDay: boolean;
  /** Nenhum livro elegível: a tela mostra o vazio e leva à Ordem. */
  empty: boolean;
  /** Páginas registradas hoje, de todos os livros. */
  pagesToday: number;
  /** Sessões de hoje em ordem cronológica, com o título do livro. */
  sessionsToday: TodaySession[];
  blocks: PlanBlock[];
  message: string;
  mascot: MascotState;
};
