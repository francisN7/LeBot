import { fontSize, lineHeight } from './typography';

/** Folga mínima entre caixa de linha e tamanho da fonte no Android. */
const MIN_RATIO = 1.15;

const largeTokens = ['xl', 'xxl', 'display'] as const;

describe('lineHeight', () => {
  it.each(largeTokens)('%s tem folga suficiente para descendentes', (token) => {
    expect(lineHeight[token]).toBeGreaterThanOrEqual(
      fontSize[token] * MIN_RATIO,
    );
  });

  it('mantém os tamanhos grandes em ordem crescente', () => {
    expect(fontSize.xl).toBeLessThan(fontSize.xxl);
    expect(fontSize.xxl).toBeLessThan(fontSize.display);
    expect(lineHeight.xl).toBeLessThan(lineHeight.xxl);
    expect(lineHeight.xxl).toBeLessThan(lineHeight.display);
  });
});
