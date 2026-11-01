import {
  offsetForStatus,
  statusFromOffset,
  statusWheelOrder,
} from './status-from-offset';

const ITEM = 56;

describe('statusFromOffset', () => {
  it('mapeia os quatro itens da roda', () => {
    expect(statusWheelOrder).toEqual([
      'reading',
      'queued',
      'paused',
      'finished',
    ]);
    expect(statusFromOffset(0, ITEM)).toBe('reading');
    expect(statusFromOffset(ITEM, ITEM)).toBe('queued');
    expect(statusFromOffset(ITEM * 2, ITEM)).toBe('paused');
    expect(statusFromOffset(ITEM * 3, ITEM)).toBe('finished');
  });

  it('arredonda para o item mais próximo do centro', () => {
    expect(statusFromOffset(ITEM * 0.4, ITEM)).toBe('reading');
    expect(statusFromOffset(ITEM * 0.6, ITEM)).toBe('queued');
    expect(statusFromOffset(ITEM * 2.49, ITEM)).toBe('paused');
    expect(statusFromOffset(ITEM * 2.51, ITEM)).toBe('finished');
  });

  it('faz clamp no overscroll das duas pontas', () => {
    expect(statusFromOffset(-500, ITEM)).toBe('reading');
    expect(statusFromOffset(ITEM * 99, ITEM)).toBe('finished');
  });

  it('tolera offset/altura inválidos sem quebrar', () => {
    expect(statusFromOffset(Number.NaN, ITEM)).toBe('reading');
    expect(statusFromOffset(ITEM, 0)).toBe('reading');
    expect(statusFromOffset(ITEM, Number.NaN)).toBe('reading');
  });
});

describe('offsetForStatus', () => {
  it('devolve o offset que centraliza cada status', () => {
    expect(offsetForStatus('reading', ITEM)).toBe(0);
    expect(offsetForStatus('queued', ITEM)).toBe(ITEM);
    expect(offsetForStatus('paused', ITEM)).toBe(ITEM * 2);
    expect(offsetForStatus('finished', ITEM)).toBe(ITEM * 3);
  });
});
