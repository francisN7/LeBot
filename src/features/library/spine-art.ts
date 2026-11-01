/**
 * Lombada 3D: mapa puro de **cor do gênero + status** para a arte.
 *
 * Não existe asset por cor. A partir da S3.2 o gênero guarda um par de hexes
 * livre, então a lombada é paramétrica: a cor vem do banco e as faces, sombras
 * e o tassel são derivados (`mixHex`). A expressão do rosto vem do status.
 *
 * Sem status, ou com hex inválido (gênero corrompido), a UI cai na lombada 2D.
 */

import { mixHex } from '@/lib/color-mix';
import {
  contrastRatio,
  isHexColor,
  MIN_CONTRAST,
  normalizeHexColor,
  relativeLuminance,
} from '@/lib/genre-color';
import { colors } from '@/theme';

import type { ReadingStatus } from './types';

/** Expressões do rosto, uma por status de leitura. */
export type SpineExpression = 'happy' | 'sleepy' | 'shine' | 'neutral';

export type SpinePalette = {
  /** Frente da lombada: a cor do gênero. */
  base: string;
  /** Vinco/charneira, borda do cilindro e arestas de topo/base. */
  edge: string;
  /** Luz do gradiente da frente. */
  light: string;
  /** Sombra de contato e sombra projetada nas pontas. */
  shadow: string;
  /** Faixas do topo/base e brilho que varre a lombada. */
  highlight: string;
  /** Rosto e linhas. Vira creme quando o fundo é escuro. */
  ink: string;
  /** Paradas do gradiente da frente: borda → base → luz → borda. */
  gradient: readonly [string, string, string, string];
};

export type SpineArt =
  | { kind: 'art'; expression: SpineExpression; palette: SpinePalette }
  /** Lombada 2D: bloco chapado, sem rosto. */
  | { kind: 'fallback'; color: string };

/** Lendo = feliz, quero ler = neutro, pausado = sonolento, concluído = brilho. */
export const expressionByStatus: Record<ReadingStatus, SpineExpression> = {
  reading: 'happy',
  queued: 'neutral',
  paused: 'sleepy',
  finished: 'shine',
};

/** Abaixo disso o fundo é escuro o bastante para sombra/lateral seguirem preto. */
const DARK_LUMINANCE = 0.35;

function fallback(color: string | null | undefined): SpineArt {
  const valid = isHexColor(color ?? '');

  return {
    kind: 'fallback',
    color: valid ? normalizeHexColor(color ?? '') : colors.navyMuted,
  };
}

function paletteFor(base: string): SpinePalette {
  const dark = relativeLuminance(base) < DARK_LUMINANCE;
  const shadeWith = dark ? '#000000' : colors.navy;
  const ink =
    contrastRatio(base, colors.navy) >= MIN_CONTRAST
      ? colors.navy
      : colors.cream;
  const edge = mixHex(base, shadeWith, dark ? 0.28 : 0.2);
  const light = mixHex(base, colors.cream, dark ? 0.2 : 0.16);

  return {
    base,
    edge,
    light,
    shadow: mixHex(base, shadeWith, 0.55),
    highlight: dark
      ? mixHex(base, colors.cream, 0.28)
      : mixHex(base, colors.cream, 0.6),
    ink,
    gradient: [edge, base, light, edge],
  };
}

/**
 * Resolve a arte da lombada. `color` é o hex já resolvido do gênero
 * (`resolveGenreColor(genre, scheme)`), nunca a lista fixa da marca.
 */
export function resolveSpineArt({
  color,
  status,
}: {
  color?: string | null;
  status?: ReadingStatus | null;
}): SpineArt {
  const expression = status ? expressionByStatus[status] : undefined;

  if (!expression || !isHexColor(color ?? '')) {
    return fallback(color);
  }

  const base = normalizeHexColor(color ?? '');

  return { kind: 'art', expression, palette: paletteFor(base) };
}
