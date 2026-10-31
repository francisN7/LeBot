/**
 * Paleta de gêneros: 10 pares claro/escuro.
 *
 * O gênero guarda a **cópia** dos hexes, não só o índice: mudar a paleta depois
 * não repinta a estante de quem já escolheu. `paletteIndex` só marca qual
 * preset está selecionado no formulário.
 *
 * As cores viram fundo da lombada e da fita. O teste de contraste garante que
 * cada tom se destaque do fundo: mínimo de 3:1 contra o creme ou contra o navy
 * (o bloco sempre aparece sobre um dos dois).
 */
export type ColorScheme = 'light' | 'dark';

export type GenreColorPair = {
  colorLight: string;
  colorDark: string;
};

export type GenrePaletteEntry = {
  /** Posição na grade de presets (0–9). */
  index: number;
  name: string;
  light: string;
  dark: string;
};

export const genrePalette = [
  { index: 0, name: 'purple', light: '#7B69EE', dark: '#B3A7FF' },
  { index: 1, name: 'coral', light: '#FF6B5B', dark: '#FF9A8F' },
  { index: 2, name: 'teal', light: '#34C6B8', dark: '#6FE3D6' },
  { index: 3, name: 'navy', light: '#2A2340', dark: '#8B84A8' },
  { index: 4, name: 'gold', light: '#FFC145', dark: '#FFD980' },
  { index: 5, name: 'pink', light: '#FF8FA3', dark: '#FFB3C1' },
  { index: 6, name: 'blue', light: '#4C7DFF', dark: '#8FAFFF' },
  { index: 7, name: 'green', light: '#3FA45B', dark: '#7DD99A' },
  { index: 8, name: 'orange', light: '#FF9F43', dark: '#FFC182' },
  { index: 9, name: 'plum', light: '#A65CC9', dark: '#D19AEB' },
] as const satisfies readonly GenrePaletteEntry[];

/** Cor do gênero no tema pedido. A UI passa `light` até existir tema escuro. */
export function resolveGenreColor(
  genre: GenreColorPair,
  scheme: ColorScheme = 'light',
): string {
  return scheme === 'dark' ? genre.colorDark : genre.colorLight;
}

/** Preset pelo índice; `undefined` quando a cor é personalizada. */
export function paletteEntryAt(
  index: number | null | undefined,
): GenrePaletteEntry | undefined {
  if (index === null || index === undefined) {
    return undefined;
  }

  return genrePalette[index];
}
