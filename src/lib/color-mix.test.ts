import { mixHex, parseHex } from './color-mix';

describe('color-mix', () => {
  it('lê um hex com e sem cerquilha', () => {
    expect(parseHex('#7B69EE')).toEqual({ r: 123, g: 105, b: 238 });
    expect(parseHex('7b69ee')).toEqual({ r: 123, g: 105, b: 238 });
  });

  it('recusa o que não é hex de seis dígitos', () => {
    expect(parseHex('#FFF')).toBeNull();
    expect(parseHex('roxo')).toBeNull();
    expect(parseHex('')).toBeNull();
  });

  it('mistura no meio do caminho', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('devolve o próprio base em ratio 0 e o outro em ratio 1', () => {
    expect(mixHex('#7B69EE', '#2A2340', 0)).toBe('#7B69EE');
    expect(mixHex('#7B69EE', '#2A2340', 1)).toBe('#2A2340');
  });

  it('trava a proporção entre 0 e 1', () => {
    expect(mixHex('#000000', '#FFFFFF', -3)).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 9)).toBe('#FFFFFF');
  });

  it('aceita minúsculas e devolve maiúsculas', () => {
    expect(mixHex('7b69ee', '2a2340', 1)).toBe('#2A2340');
  });

  it('devolve o base intacto quando um dos hexes é inválido', () => {
    expect(mixHex('7b69ee', 'roxo', 0.5)).toBe('7b69ee');
    expect(mixHex('roxo', '#FFFFFF', 0.5)).toBe('roxo');
  });
});
