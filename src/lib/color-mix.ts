/**
 * Mistura de cores em hex — base para a lombada 3D vetorial.
 *
 * A cor do gênero vem do banco (qualquer `#RRGGBB`), então sombra e brilho não
 * podem ser hexes fixos: são calculados a partir da cor escolhida.
 */

import { isHexColor, normalizeHexColor } from './genre-color';

export type Rgb = { r: number; g: number; b: number };

/** `#RRGGBB` → canais; `null` quando o hex não é válido. */
export function parseHex(hex: string): Rgb | null {
  if (!isHexColor(hex)) {
    return null;
  }

  const normalized = normalizeHexColor(hex);

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function channelHex(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

function toHex({ r, g, b }: Rgb): string {
  return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`;
}

/**
 * Mistura `over` sobre `base`: `ratio` 0 devolve `base`, 1 devolve `over`.
 * Hex inválido ou proporção fora de 0–1 caem no limite mais próximo.
 */
export function mixHex(base: string, over: string, ratio: number): string {
  const from = parseHex(base);
  const to = parseHex(over);

  if (!from || !to) {
    return base;
  }

  const amount = Math.min(1, Math.max(0, ratio));

  return toHex({
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  });
}
