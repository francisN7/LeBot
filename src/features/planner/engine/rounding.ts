import { ROUND_UP_ABOVE_PERCENT } from './constants';

/** Inteiro não negativo; `NaN` e negativo viram 0. */
function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

/**
 * `percent` por cento de `goal`, arredondado com corte em 0,7: fração maior
 * que 0,7 sobe, o resto desce. A conta é inteira para 21 × 70% = 14,7 descer
 * para 14 sem depender de ponto flutuante.
 */
export function percentOf(goal: number, percent: number): number {
  const scaled = nonNegativeInteger(goal) * nonNegativeInteger(percent);
  const whole = Math.floor(scaled / 100);
  const fraction = scaled - whole * 100;
  return whole + (fraction > ROUND_UP_ABOVE_PERCENT ? 1 : 0);
}

/** O plano nunca tem 0 página. */
export function atLeastOnePage(value: number): number {
  return Math.max(1, value);
}
