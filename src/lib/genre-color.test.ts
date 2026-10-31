import {
  contrastRatio,
  isHexColor,
  isLowContrast,
  MIN_CONTRAST,
  normalizeHexColor,
  validateColorPair,
} from './genre-color';

describe('normalizeHexColor', () => {
  it('deixa em maiúsculo e garante o #', () => {
    expect(normalizeHexColor(' #7b69ee ')).toBe('#7B69EE');
    expect(normalizeHexColor('7b69ee')).toBe('#7B69EE');
  });
});

describe('isHexColor', () => {
  it('aceita 6 dígitos hexadecimais', () => {
    expect(isHexColor('#7B69EE')).toBe(true);
    expect(isHexColor('#000000')).toBe(true);
    expect(isHexColor('ffc145')).toBe(true);
  });

  it('recusa tamanho, caracteres e nomes de cor', () => {
    expect(isHexColor('#FFF')).toBe(false);
    expect(isHexColor('#GGGGGG')).toBe(false);
    expect(isHexColor('purple')).toBe(false);
    expect(isHexColor('')).toBe(false);
  });
});

describe('contrastRatio', () => {
  it('vai de 1:1 a 21:1', () => {
    expect(contrastRatio('#000000', '#000000')).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('não depende da ordem', () => {
    expect(contrastRatio('#7B69EE', '#2A2340')).toBeCloseTo(
      contrastRatio('#2A2340', '#7B69EE'),
      5,
    );
  });

  it('avisa contraste baixo sem depender do par', () => {
    expect(isLowContrast('#FFC145', '#FFF6E8')).toBe(true);
    expect(contrastRatio('#2A2340', '#FFF6E8')).toBeGreaterThan(MIN_CONTRAST);
    expect(isLowContrast('#2A2340', '#FFF6E8')).toBe(false);
  });
});

describe('validateColorPair', () => {
  it('normaliza um par válido', () => {
    expect(validateColorPair(' #7b69ee ', 'b3a7ff')).toEqual({
      ok: true,
      light: '#7B69EE',
      dark: '#B3A7FF',
    });
  });

  it('aponta o campo com hex inválido', () => {
    const result = validateColorPair('#FFF', '#B3A7FF');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.light).toBe(
      'Use um hex como #7B69EE',
    );
  });

  it('recusa claro e escuro iguais', () => {
    const result = validateColorPair('#7B69EE', '#7b69ee');

    expect(result).toEqual({
      ok: false,
      errors: { dark: 'O par escuro precisa ser diferente do claro' },
    });
  });
});
