/**
 * Escala de espaçamento (em points) usada em padding, gap e margin.
 * Multiplicada por 4 para manter ritmo consistente com o Tailwind.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;
