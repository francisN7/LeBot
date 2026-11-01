/**
 * Ajuste do título na etiqueta da lombada.
 *
 * A etiqueta é pequena e o título pode ser longo demais. A fonte encolhe em
 * passos de 0,25 px até um mínimo; se nem no mínimo couber em duas linhas, o
 * `Text` aplica ellipsis (o componente usa `numberOfLines={2}`).
 */

/** Duas linhas cabem na altura da etiqueta. */
const MAX_LINES = 2;
/** Largura média de um caractere em relação ao tamanho da fonte. */
const CHARACTER_WIDTH = 0.55;

export function fitSpineTitle({
  title,
  width,
  maxFontSize,
  minFontSize,
}: {
  title: string;
  width: number;
  maxFontSize: number;
  minFontSize: number;
}): number {
  const text = title.trim();

  if (!text || width <= 0) {
    return maxFontSize;
  }

  const charsPerLine = (fontSize: number) =>
    Math.max(1, Math.floor(width / (fontSize * CHARACTER_WIDTH)));

  let fontSize = maxFontSize;

  while (
    fontSize > minFontSize &&
    Math.ceil(text.length / charsPerLine(fontSize)) > MAX_LINES
  ) {
    fontSize = Math.max(minFontSize, Math.round((fontSize - 0.25) * 100) / 100);
  }

  return fontSize;
}
