import { colors } from './colors';

const HEX_COLOR = /^#[0-9A-F]{6}$/;

describe('colors', () => {
  it('expõe todas as cores da paleta', () => {
    expect(Object.keys(colors).sort()).toEqual([
      'coral',
      'cream',
      'gold',
      'goldDeep',
      'navy',
      'pink',
      'pinkSoft',
      'purple',
      'teal',
    ]);
  });

  it('usa hex maiúsculo de 6 dígitos em todos os tokens', () => {
    for (const [token, value] of Object.entries(colors)) {
      expect({ token, value }).toEqual({
        token,
        value: expect.stringMatching(HEX_COLOR),
      });
    }
  });

  it('não repete a mesma cor em tokens diferentes', () => {
    const values = Object.values(colors);
    expect(new Set(values).size).toBe(values.length);
  });
});
