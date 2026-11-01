import {
  barHeight,
  barWidth,
  compactPages,
  decimalLabel,
  sharePercent,
} from './charts';

describe('barHeight', () => {
  it('escala pela maior barra e respeita o piso', () => {
    expect(barHeight(0, 10)).toBe(6);
    expect(barHeight(10, 10)).toBe(96);
    expect(barHeight(5, 10)).toBe(48);
    expect(barHeight(1, 1000)).toBe(6);
  });
});

describe('barWidth', () => {
  it('afina quando há muitas barras', () => {
    expect(barWidth(4)).toBe(32);
    expect(barWidth(12)).toBe(18);
  });
});

describe('compactPages', () => {
  it('encurta milhares e esconde zero', () => {
    expect(compactPages(0)).toBe('');
    expect(compactPages(84)).toBe('84');
    expect(compactPages(1240)).toBe('1,2k');
    expect(compactPages(1000)).toBe('1,0k');
  });
});

describe('sharePercent', () => {
  it('arredonda com mínimo visível', () => {
    expect(sharePercent(0, 100)).toBe(0);
    expect(sharePercent(1, 1000)).toBe(2);
    expect(sharePercent(50, 100)).toBe(50);
    expect(sharePercent(200, 100)).toBe(100);
  });
});

describe('decimalLabel', () => {
  it('usa vírgula', () => {
    expect(decimalLabel(4.2)).toBe('4,2');
    expect(decimalLabel(5)).toBe('5,0');
  });
});
