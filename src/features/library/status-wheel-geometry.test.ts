import {
  clampWheelCenter,
  statusFromAngle,
  statusFromPointer,
  WHEEL_DEAD_ZONE,
  WHEEL_HALF_EXTENT,
} from './status-wheel-geometry';

describe('statusFromAngle', () => {
  it('mapeia os quatro setores da roda', () => {
    expect(statusFromAngle(-90)).toBe('reading');
    expect(statusFromAngle(0)).toBe('queued');
    expect(statusFromAngle(90)).toBe('paused');
    expect(statusFromAngle(180)).toBe('finished');
  });

  it('normaliza voltas e ângulos negativos', () => {
    expect(statusFromAngle(270)).toBe('reading');
    expect(statusFromAngle(-180)).toBe('finished');
    expect(statusFromAngle(450)).toBe('paused');
    expect(statusFromAngle(-450)).toBe('reading');
  });

  it('escolhe o setor mais próximo nas fronteiras', () => {
    expect(statusFromAngle(-45)).toBe('queued');
    expect(statusFromAngle(-134)).toBe('reading');
    expect(statusFromAngle(44)).toBe('queued');
    expect(statusFromAngle(46)).toBe('paused');
  });

  it('tolera ângulo inválido', () => {
    expect(statusFromAngle(Number.NaN)).toBe('reading');
  });
});

describe('statusFromPointer', () => {
  const center = { x: 100, y: 100 };

  it('devolve o setor da direção do dedo', () => {
    expect(statusFromPointer({ x: 100, y: 20 }, center)).toBe('reading');
    expect(statusFromPointer({ x: 180, y: 100 }, center)).toBe('queued');
    expect(statusFromPointer({ x: 100, y: 180 }, center)).toBe('paused');
    expect(statusFromPointer({ x: 20, y: 100 }, center)).toBe('finished');
  });

  it('não seleciona nada dentro do miolo', () => {
    expect(statusFromPointer({ x: 100, y: 100 }, center)).toBeNull();
    expect(
      statusFromPointer({ x: 100 + WHEEL_DEAD_ZONE - 1, y: 100 }, center),
    ).toBeNull();
    expect(
      statusFromPointer({ x: 100 + WHEEL_DEAD_ZONE + 1, y: 100 }, center),
    ).toBe('queued');
  });

  it('ignora coordenada inválida', () => {
    expect(statusFromPointer({ x: Number.NaN, y: 100 }, center)).toBeNull();
  });
});

describe('clampWheelCenter', () => {
  const area = { width: 390, height: 700 };

  it('mantém a roda dentro da área', () => {
    expect(clampWheelCenter({ x: 0, y: 0 }, area)).toEqual({
      x: WHEEL_HALF_EXTENT + 8,
      y: WHEEL_HALF_EXTENT + 8,
    });
    expect(clampWheelCenter({ x: 999, y: 999 }, area)).toEqual({
      x: 390 - WHEEL_HALF_EXTENT - 8,
      y: 700 - WHEEL_HALF_EXTENT - 8,
    });
  });

  it('não move o centro quando cabe com folga', () => {
    expect(clampWheelCenter({ x: 195, y: 300 }, area)).toEqual({
      x: 195,
      y: 300,
    });
  });

  it('centraliza quando a área é menor que a roda', () => {
    expect(
      clampWheelCenter({ x: 10, y: 10 }, { width: 100, height: 80 }),
    ).toEqual({ x: 50, y: 40 });
  });
});
