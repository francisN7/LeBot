import { sizes } from '@/theme';

/** Altura da barra proporcional ao maior valor da série, com piso visível. */
export function barHeight(pages: number, maxPages: number): number {
  if (pages <= 0 || maxPages <= 0) {
    return sizes.chart.barMinHeight;
  }

  const raw = Math.round((pages / maxPages) * sizes.chart.plotHeight);

  return Math.max(
    sizes.chart.barMinHeight,
    Math.min(sizes.chart.plotHeight, raw),
  );
}

/** Barras mais finas quando há muitas (12 semanas ou 12 meses). */
export function barWidth(bucketCount: number): number {
  return bucketCount > 7 ? sizes.chart.barWidthCompact : sizes.chart.barWidth;
}

/**
 * 1240 → "1k". O valor em cima de uma barra estreita não cabe por extenso,
 * mas o leitor de tela sempre ouve o número inteiro.
 */
export function compactPages(pages: number): string {
  if (pages <= 0) {
    return '';
  }

  if (pages < 1000) {
    return String(pages);
  }

  return `${Math.round(pages / 1000)}k`;
}

/** Fatia de uma barra horizontal (0–100), com 2% mínimo para não sumir. */
export function sharePercent(value: number, total: number): number {
  if (value <= 0 || total <= 0) {
    return 0;
  }

  return Math.max(2, Math.min(100, Math.round((value / total) * 100)));
}

/** Valor decimal de nota com vírgula (4.2 → "4,2"). */
export function decimalLabel(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
