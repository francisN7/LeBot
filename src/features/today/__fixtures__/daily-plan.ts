import type { DailyPlan } from '../types';

/** Plano fictício da S1. O cálculo real é determinístico e chega na S6. */
export const dailyPlan: DailyPlan = {
  dateLabel: 'sábado, 31 de outubro',
  pages: 18,
  minutes: 35,
  streak: 4,
  message: 'Hoje são 18 páginas. Dá tempo.',
  blocks: [
    { id: 'block-manha', label: 'Manhã', pages: 6, status: 'done' },
    { id: 'block-almoco', label: 'Almoço', pages: 4, status: 'next' },
    { id: 'block-noite', label: 'Noite', pages: 8, status: 'later' },
  ],
};
