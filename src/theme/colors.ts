/**
 * Tokens de cor da marca LêBot.
 * Fonte da verdade: `docs/brand.md`.
 */
export const colors = {
  cream: '#FFF6E8',
  pink: '#FF8FA3',
  pinkSoft: '#FFB1BF',
  navy: '#2A2340',
  gold: '#FFC145',
  goldDeep: '#F4B43A',
  coral: '#FF6B5B',
  teal: '#34C6B8',
  purple: '#7B69EE',
  surface: '#FFFFFF',
  /** Derivada do navy para rótulos inativos; mantém contraste sobre o creme. */
  navyMuted: '#6E687F',
} as const;

export type ColorToken = keyof typeof colors;
