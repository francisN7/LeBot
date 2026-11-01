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

/** Plano do dia já cruzado com os livros e as sessões de hoje. */
export type DailyPlanView = {
  dateLabel: string;
  goal: number;
  baseGoal: number;
  lightDay: boolean;
  /** Nenhum livro elegível: a tela mostra o vazio e leva à Fila. */
  empty: boolean;
  /** Páginas registradas hoje, de todos os livros. */
  pagesToday: number;
  blocks: PlanBlock[];
  message: string;
  mascot: MascotState;
};
