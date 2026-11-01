import { atLeastOnePage, percentOf } from './rounding';

describe('percentOf', () => {
  it('sobe quando a fração passa de 0,7', () => {
    expect(percentOf(18, 60)).toBe(11); // 10,8
    expect(percentOf(27, 70)).toBe(19); // 18,9
  });

  it('desce quando a fração é 0,7 ou menos', () => {
    expect(percentOf(21, 70)).toBe(14); // 14,7 exato
    expect(percentOf(21, 60)).toBe(12); // 12,6
    expect(percentOf(18, 70)).toBe(12); // 12,6
    expect(percentOf(10, 70)).toBe(7); // 7,0
  });

  it('funciona nos extremos inteiros', () => {
    expect(percentOf(10, 60)).toBe(6);
    expect(percentOf(200, 70)).toBe(140);
    expect(percentOf(3, 70)).toBe(2);
    expect(percentOf(0, 60)).toBe(0);
    expect(percentOf(18, 0)).toBe(0);
    expect(percentOf(18, 100)).toBe(18);
  });

  it('não estoura com entrada inválida', () => {
    expect(percentOf(Number.NaN, 60)).toBe(0);
    expect(percentOf(18, Number.NaN)).toBe(0);
    expect(percentOf(-18, 60)).toBe(0);
  });
});

describe('atLeastOnePage', () => {
  it('nunca devolve menos de 1', () => {
    expect(atLeastOnePage(0)).toBe(1);
    expect(atLeastOnePage(-5)).toBe(1);
    expect(atLeastOnePage(2)).toBe(2);
  });
});
