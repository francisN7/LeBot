/** Tamanhos de componentes que não cabem na escala de espaçamento. */
export const sizes = {
  spine: { width: 88, height: 128 },
  spineCompact: { width: 72, height: 104 },
  /** Fita de gênero sobre a capa (canto superior esquerdo). */
  bookmark: { width: 18, height: 28 },
  /** Amostra do par de cores na lista e no formulário de gênero. */
  genreSwatch: { width: 48, height: 32 },
} as const;

export const borderWidths = {
  hairline: 1,
  strong: 2,
} as const;

export const opacities = {
  decor: 0.25,
  disabled: 0.5,
  muted: 0.7,
} as const;
