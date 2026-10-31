import { testGenreRows } from '@/test-utils/repositories';
import { genrePalette } from '@/theme';

import {
  applyPreset,
  emptyGenreForm,
  formFromGenre,
  previewColor,
  startCustom,
  validateGenreForm,
} from './genre-form';

const names = testGenreRows.map((genre) => ({
  id: genre.id,
  name: genre.name,
}));

describe('validateGenreForm', () => {
  it('exige o nome', () => {
    const result = validateGenreForm(emptyGenreForm, names);

    expect(result).toEqual({
      ok: false,
      errors: { name: 'Informe o nome do gênero' },
    });
  });

  it('recusa nome repetido ignorando caixa e acento', () => {
    const result = validateGenreForm(
      applyPreset({ ...emptyGenreForm, name: 'terror' }, 2),
      names,
    );

    expect(result).toEqual({
      ok: false,
      errors: { name: 'Já existe um gênero com este nome' },
    });
  });

  it('libera o próprio nome ao editar', () => {
    const form = formFromGenre({
      id: 'fantasy',
      name: 'Fantasia',
      colorLight: '#7B69EE',
      colorDark: '#B3A7FF',
      paletteIndex: 0,
      isDefault: true,
      sortOrder: 0,
    });

    expect(validateGenreForm(form, names, 'fantasy')).toEqual({
      ok: true,
      input: {
        name: 'Fantasia',
        colorLight: '#7B69EE',
        colorDark: '#B3A7FF',
        paletteIndex: 0,
      },
    });
  });

  it('copia o par de cores do preset escolhido', () => {
    const form = applyPreset({ ...emptyGenreForm, name: 'Poesia' }, 4);
    const result = validateGenreForm(form, names);

    expect(result.ok && result.input).toEqual({
      name: 'Poesia',
      colorLight: genrePalette[4].light,
      colorDark: genrePalette[4].dark,
      paletteIndex: 4,
    });
  });

  it('aceita cor personalizada válida e grava paletteIndex nulo', () => {
    const form = {
      ...startCustom({ ...emptyGenreForm, name: 'Poesia' }),
      colorLight: '#123abc',
      colorDark: '#abcdef',
    };
    const result = validateGenreForm(form, names);

    expect(result).toEqual({
      ok: true,
      input: {
        name: 'Poesia',
        colorLight: '#123ABC',
        colorDark: '#ABCDEF',
        paletteIndex: null,
      },
    });
  });

  it('bloqueia hex inválido e par igual', () => {
    const invalid = validateGenreForm(
      { ...emptyGenreForm, name: 'Poesia', mode: 'custom', colorLight: '#FFF' },
      names,
    );

    expect(invalid.ok ? undefined : invalid.errors.light).toBe(
      'Use um hex como #7B69EE',
    );

    const equal = validateGenreForm(
      {
        ...emptyGenreForm,
        name: 'Poesia',
        mode: 'custom',
        colorLight: '#7B69EE',
        colorDark: '#7B69EE',
      },
      names,
    );

    expect(equal.ok ? undefined : equal.errors.dark).toBe(
      'O par escuro precisa ser diferente do claro',
    );
  });
});

describe('previewColor', () => {
  it('usa o claro por padrão e o escuro quando pedido', () => {
    const form = {
      ...emptyGenreForm,
      colorLight: '#111111',
      colorDark: '#EEEEEE',
    };

    expect(previewColor(form)).toBe('#111111');
    expect(previewColor(form, 'dark')).toBe('#EEEEEE');
  });
});
