/**
 * Tipografia da marca. Os nomes das famílias são as chaves registradas em
 * `useFonts` no layout raiz; nunca use `fontWeight` junto com uma família
 * pesada (o peso já está no arquivo da fonte).
 */
export const fontFamily = {
  display: 'Fredoka_700Bold',
  heading: 'Fredoka_600SemiBold',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  display: 52,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 34,
  xxl: 42,
  display: 56,
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
export type FontSizeToken = keyof typeof fontSize;
