import { contrastRatio, MIN_CONTRAST } from '@/lib/genre-color';
import { colors } from './colors';
import {
  genrePalette,
  paletteEntryAt,
  resolveGenreColor,
} from './genre-colors';

describe('genrePalette', () => {
  it('tem 10 pares com índices de 0 a 9', () => {
    expect(genrePalette).toHaveLength(10);
    expect(genrePalette.map((entry) => entry.index)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('usa hex válido e um par diferente em cada preset', () => {
    for (const entry of genrePalette) {
      expect(entry.light).toMatch(/^#[0-9A-F]{6}$/);
      expect(entry.dark).toMatch(/^#[0-9A-F]{6}$/);
      expect(entry.dark).not.toBe(entry.light);
    }
  });

  it('não deixa nenhum tom sumir do fundo (≥ 3:1 em creme ou navy)', () => {
    // O bloco colorido fica sobre o creme e tem contorno navy: precisa
    // contrastar com pelo menos um dos dois para não desaparecer.
    for (const entry of genrePalette) {
      for (const tone of [entry.light, entry.dark]) {
        const best = Math.max(
          contrastRatio(tone, colors.cream),
          contrastRatio(tone, colors.navy),
        );

        expect(best).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    }
  });
});

describe('resolveGenreColor', () => {
  const genre = { colorLight: '#7B69EE', colorDark: '#B3A7FF' };

  it('devolve o tom claro por padrão', () => {
    expect(resolveGenreColor(genre)).toBe('#7B69EE');
    expect(resolveGenreColor(genre, 'light')).toBe('#7B69EE');
  });

  it('devolve o tom escuro quando o tema chegar', () => {
    expect(resolveGenreColor(genre, 'dark')).toBe('#B3A7FF');
  });
});

describe('paletteEntryAt', () => {
  it('encontra o preset pelo índice', () => {
    expect(paletteEntryAt(0)?.name).toBe('purple');
    expect(paletteEntryAt(9)?.name).toBe('plum');
  });

  it('devolve undefined para cor personalizada', () => {
    expect(paletteEntryAt(null)).toBeUndefined();
    expect(paletteEntryAt(42)).toBeUndefined();
  });
});
