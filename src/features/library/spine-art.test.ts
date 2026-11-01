import { relativeLuminance } from '@/lib/genre-color';
import { colors } from '@/theme';

import { resolveSpineArt, type SpineArt } from './spine-art';

function artOf(input: Parameters<typeof resolveSpineArt>[0]) {
  const art = resolveSpineArt(input);

  if (art.kind !== 'art') {
    throw new Error('esperava lombada 3D');
  }

  return art;
}

describe('resolveSpineArt', () => {
  it.each([
    ['reading', 'happy'],
    ['queued', 'neutral'],
    ['paused', 'sleepy'],
    ['finished', 'shine'],
  ] as const)('status %s vira a expressão %s', (status, expression) => {
    expect(artOf({ color: colors.purple, status }).expression).toBe(expression);
  });

  it('usa a cor do gênero como base, sem lista fixa', () => {
    expect(artOf({ color: '#123456', status: 'reading' }).palette.base).toBe(
      '#123456',
    );
  });

  it('normaliza hex minúsculo', () => {
    expect(artOf({ color: '#7b69ee', status: 'queued' }).palette.base).toBe(
      '#7B69EE',
    );
  });

  it('deriva lateral, vinco e sombra mais escuros que a base', () => {
    const { palette } = artOf({ color: colors.gold, status: 'reading' });

    for (const shade of [palette.side, palette.edge, palette.shadow]) {
      expect(shade).not.toBe(palette.base);
      expect(relativeLuminance(shade)).toBeLessThan(
        relativeLuminance(palette.base),
      );
    }
  });

  it('deriva luz e brilho mais claros que a base', () => {
    const { palette } = artOf({ color: colors.gold, status: 'reading' });

    expect(palette.light).not.toBe(palette.base);
    expect(palette.highlight).not.toBe(palette.base);
    expect(relativeLuminance(palette.light)).toBeGreaterThan(
      relativeLuminance(palette.base),
    );
    expect(relativeLuminance(palette.highlight)).toBeGreaterThan(
      relativeLuminance(palette.base),
    );
  });

  it('monta o gradiente da frente em quatro paradas', () => {
    const { palette } = artOf({ color: colors.purple, status: 'reading' });

    expect(palette.gradient).toEqual([
      palette.edge,
      palette.base,
      palette.light,
      palette.side,
    ]);
  });

  it('deriva o tassel entre a base e o rosto', () => {
    const { palette } = artOf({ color: colors.gold, status: 'reading' });

    expect(palette.accent).not.toBe(palette.base);
    expect(palette.accent).not.toBe(palette.ink);
  });

  it('escurece as faces mesmo quando o gênero já é escuro', () => {
    const { palette } = artOf({ color: colors.navy, status: 'reading' });

    expect(relativeLuminance(palette.side)).toBeLessThan(
      relativeLuminance(palette.base),
    );
    expect(relativeLuminance(palette.edge)).toBeLessThan(
      relativeLuminance(palette.base),
    );
  });

  it('mantém o rosto navy em fundo claro', () => {
    expect(artOf({ color: colors.gold, status: 'reading' }).palette.ink).toBe(
      colors.navy,
    );
  });

  it('troca o rosto para creme em fundo escuro', () => {
    expect(artOf({ color: colors.navy, status: 'reading' }).palette.ink).toBe(
      colors.cream,
    );
  });

  it('aceita o tom escuro do par do gênero', () => {
    const claro = artOf({ color: '#7B69EE', status: 'reading' }).palette;
    const escuro = artOf({ color: '#B3A7FF', status: 'reading' }).palette;

    expect(escuro.base).not.toBe(claro.base);
    expect(escuro.side).not.toBe(claro.side);
  });

  it('cai na lombada 2D sem status', () => {
    expect(resolveSpineArt({ color: colors.coral })).toEqual({
      kind: 'fallback',
      color: colors.coral,
    });
  });

  it('cai na lombada 2D com hex inválido', () => {
    expect(resolveSpineArt({ color: '#12345', status: 'reading' })).toEqual({
      kind: 'fallback',
      color: colors.navyMuted,
    });
  });

  it('cai na lombada 2D sem cor', () => {
    const art: SpineArt = resolveSpineArt({ status: 'reading' });

    expect(art).toEqual({ kind: 'fallback', color: colors.navyMuted });
  });
});
