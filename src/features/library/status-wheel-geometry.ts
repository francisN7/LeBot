import type { ReadingStatus } from './types';

export type Point = { x: number; y: number };
export type Area = { width: number; height: number };

/** Sentido horário a partir da direita: topo, direita, baixo, esquerda. */
export const statusWheelOrder: readonly ReadingStatus[] = [
  'reading',
  'queued',
  'paused',
  'finished',
];

/** Ângulo de cada opção em graus de tela (y cresce para baixo). */
export const statusAngles: Record<ReadingStatus, number> = {
  reading: -90,
  queued: 0,
  paused: 90,
  finished: 180,
};

/** Raio até o centro de cada opção. */
export const WHEEL_RADIUS = 80;
export const OPTION_WIDTH = 80;
export const OPTION_HEIGHT = 36;
/** Metade do quadrado que contém a roda, incluindo a largura das pílulas. */
export const WHEEL_HALF_EXTENT = WHEEL_RADIUS + OPTION_WIDTH / 2 + 4;
/** Abaixo disso o dedo está no miolo: não há seleção. */
export const WHEEL_DEAD_ZONE = 26;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Converte um ângulo de tela no status do setor correspondente. */
export function statusFromAngle(angleDegrees: number): ReadingStatus {
  if (!Number.isFinite(angleDegrees)) {
    return 'reading';
  }

  const normalized = ((angleDegrees % 360) + 360) % 360;
  const index = Math.round(normalized / 90) % 4;
  const byIndex: readonly ReadingStatus[] = [
    'queued',
    'paused',
    'finished',
    'reading',
  ];

  // 0° = direita (quero ler), 90° = baixo (pausado), 180° = esquerda
  // (concluído), 270° = topo (lendo).
  return byIndex[index] ?? 'reading';
}

/** Status sob o dedo; `null` dentro do miolo ou sem coordenada válida. */
export function statusFromPointer(
  pointer: Point,
  center: Point,
): ReadingStatus | null {
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;

  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return null;
  }

  if (Math.hypot(dx, dy) < WHEEL_DEAD_ZONE) {
    return null;
  }

  return statusFromAngle((Math.atan2(dy, dx) * 180) / Math.PI);
}

/**
 * Mantém a roda inteira dentro da tela; perto das bordas o centro desliza para
 * dentro em vez de cortar as opções. Em telas menores que a roda, centraliza.
 */
export function clampWheelCenter(point: Point, area: Area): Point {
  const margin = 8;
  const minX = WHEEL_HALF_EXTENT + margin;
  const maxX = area.width - WHEEL_HALF_EXTENT - margin;
  const minY = WHEEL_HALF_EXTENT + margin;
  const maxY = area.height - WHEEL_HALF_EXTENT - margin;

  return {
    x: minX <= maxX ? clamp(point.x, minX, maxX) : Math.max(area.width, 0) / 2,
    y: minY <= maxY ? clamp(point.y, minY, maxY) : Math.max(area.height, 0) / 2,
  };
}
