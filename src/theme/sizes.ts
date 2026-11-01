/** Tamanhos de componentes que não cabem na escala de espaçamento. */
export const sizes = {
  /**
   * Capa com foto: 2:3. A lombada sem capa é mais estreita (`spine`) para ler
   * como objeto fino; a altura é a mesma nos dois casos.
   */
  cover: { width: 88, height: 128 },
  coverCompact: { width: 72, height: 104 },
  /** Lombada de frente: 1:2 exato (64×128 e 52×104), sem esticar o rosto. */
  spine: { width: 64, height: 128 },
  spineCompact: { width: 52, height: 104 },
  /** Fita de gênero sobre a capa (canto superior esquerdo). */
  bookmark: { width: 18, height: 28 },
  /** Amostra do par de cores na lista e no formulário de gênero. */
  genreSwatch: { width: 48, height: 32 },
  /** Gráfico de ritmo de "Meu ritmo": prateleira, barras e base. */
  chart: {
    plotHeight: 96,
    barMinHeight: 6,
    barWidth: 32,
    barWidthCompact: 18,
  },
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
