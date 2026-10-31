/** Raios de borda da UI. Cards usam `lg`; chips e botões usam `pill`. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;
