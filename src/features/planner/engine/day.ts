/**
 * A matemática de dia local vive em `src/lib/day.ts` desde a S10, porque as
 * estatísticas também contam dias. Reexportado para o motor do plano não mudar
 * de contrato.
 */
export { daysBetween, toLocalDayKey } from '@/lib/day';
