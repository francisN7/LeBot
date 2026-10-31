import type { CreateGenreInput } from '@/db/repositories';
import { validateColorPair } from '@/lib/genre-color';
import { normalizeGenreName } from '@/lib/genre-name';
import { genrePalette } from '@/theme';

import type { Genre } from './types';

/** O formulário guarda cores como texto e o modo escolhido. */
export type GenreFormState = {
  name: string;
  mode: 'preset' | 'custom';
  paletteIndex: number;
  colorLight: string;
  colorDark: string;
};

export type GenreFormErrors = Partial<
  Record<'name' | 'light' | 'dark', string>
>;

export type GenreFormResult =
  | { ok: true; input: Omit<CreateGenreInput, 'id'> }
  | { ok: false; errors: GenreFormErrors };

export const emptyGenreForm: GenreFormState = {
  name: '',
  mode: 'preset',
  paletteIndex: 0,
  colorLight: genrePalette[0].light,
  colorDark: genrePalette[0].dark,
};

export function formFromGenre(genre: Genre): GenreFormState {
  const onPalette =
    genre.paletteIndex !== null &&
    genre.paletteIndex >= 0 &&
    genre.paletteIndex < genrePalette.length;

  return {
    name: genre.name,
    mode: onPalette ? 'preset' : 'custom',
    paletteIndex: genre.paletteIndex ?? 0,
    colorLight: genre.colorLight,
    colorDark: genre.colorDark,
  };
}

/** Troca para a paleta e copia o par escolhido para o formulário. */
export function applyPreset(
  state: GenreFormState,
  index: number,
): GenreFormState {
  const entry = genrePalette[index];

  if (!entry) {
    return state;
  }

  return {
    ...state,
    mode: 'preset',
    paletteIndex: entry.index,
    colorLight: entry.light,
    colorDark: entry.dark,
  };
}

/** Mantém os hexes atuais como ponto de partida da cor personalizada. */
export function startCustom(state: GenreFormState): GenreFormState {
  return { ...state, mode: 'custom' };
}

/** Cor exibida no preview; a UI passa `light` até existir tema escuro. */
export function previewColor(
  state: GenreFormState,
  scheme: 'light' | 'dark' = 'light',
): string {
  return scheme === 'dark' ? state.colorDark : state.colorLight;
}

/**
 * Valida nome (obrigatório e único, ignorando caixa/acento) e o par de cores.
 * `names` são os gêneros já cadastrados; `exceptId` libera o próprio nome.
 */
export function validateGenreForm(
  state: GenreFormState,
  names: readonly Pick<Genre, 'id' | 'name'>[],
  exceptId?: string,
): GenreFormResult {
  const errors: GenreFormErrors = {};
  const name = state.name.trim();

  if (name.length === 0) {
    errors.name = 'Informe o nome do gênero';
  } else if (name.length > 40) {
    errors.name = 'Use até 40 caracteres';
  } else {
    const wanted = normalizeGenreName(name);
    const duplicated = names.some(
      (genre) =>
        genre.id !== exceptId && normalizeGenreName(genre.name) === wanted,
    );

    if (duplicated) {
      errors.name = 'Já existe um gênero com este nome';
    }
  }

  const pair = validateColorPair(state.colorLight, state.colorDark);

  if (errors.name || !pair.ok) {
    if (!pair.ok) {
      errors.light = pair.errors.light;
      errors.dark = pair.errors.dark;
    }

    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      name,
      colorLight: pair.light,
      colorDark: pair.dark,
      paletteIndex: state.mode === 'preset' ? state.paletteIndex : null,
    },
  };
}
