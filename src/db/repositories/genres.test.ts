import { createBooksRepository } from '@/db/repositories/books';
import { createGenresRepository } from '@/db/repositories/genres';
import { defaultGenreIds } from '@/db/schema';
import { createTestDatabase } from '@/test-utils/sqlite';
import { genrePalette } from '@/theme/genre-colors';

async function createRepositories() {
  const db = await createTestDatabase();

  return {
    db,
    genres: createGenresRepository(db),
    books: createBooksRepository(db),
  };
}

const baseBook = {
  title: 'O Hobbit',
  author: 'J. R. R. Tolkien',
  status: 'reading',
  pages: 310,
  pagesRead: 0,
} as const;

describe('genres repository', () => {
  it('começa com os 6 gêneros de fábrica da migração', async () => {
    const { genres } = await createRepositories();
    const rows = genres.list();

    expect(rows.map((genre) => genre.id)).toEqual([...defaultGenreIds]);
    expect(rows.map((genre) => genre.name)).toEqual([
      'Fantasia',
      'Romance',
      'Não-ficção',
      'Clássico',
      'Infantojuvenil',
      'Terror',
    ]);
    expect(rows.every((genre) => genre.isDefault)).toBe(true);
  });

  it('mantém as cores de fábrica iguais aos presets da paleta', async () => {
    const { genres } = await createRepositories();

    for (const genre of genres.list()) {
      const preset = genrePalette[genre.paletteIndex ?? -1];

      expect(preset).toBeDefined();
      expect(genre.colorLight).toBe(preset?.light);
      expect(genre.colorDark).toBe(preset?.dark);
    }
  });

  it('cria gênero no fim da ordem com id gerado', async () => {
    const { genres } = await createRepositories();

    const created = genres.create({
      name: 'Poesia',
      colorLight: '#4C7DFF',
      colorDark: '#8FAFFF',
      paletteIndex: 6,
    });

    expect(created.id).toMatch(/^genre-/);
    expect(created.sortOrder).toBe(6);
    expect(created.isDefault).toBe(false);
    expect(genres.list().at(-1)?.name).toBe('Poesia');
  });

  it('devolve o nome novo ao renomear e atualiza a cor', async () => {
    const { genres } = await createRepositories();

    const updated = genres.update('fantasy', {
      name: 'Fantasia épica',
      colorLight: '#A65CC9',
      colorDark: '#D19AEB',
      paletteIndex: 9,
    });

    expect(updated?.name).toBe('Fantasia épica');
    expect(genres.findById('fantasy')?.colorLight).toBe('#A65CC9');
  });

  it('recusa nome duplicado ignorando caixa e acento', async () => {
    const { genres } = await createRepositories();

    expect(() =>
      genres.create({
        name: 'fantasia',
        colorLight: '#7B69EE',
        colorDark: '#B3A7FF',
      }),
    ).toThrow('Já existe um gênero com este nome');

    expect(() => genres.update('romance', { name: 'NAO-FICCAO' })).toThrow(
      'Já existe um gênero com este nome',
    );

    // O próprio nome continua liberado na edição.
    expect(() => genres.update('romance', { name: 'Romance' })).not.toThrow();
  });

  it('recusa par de cores igual ou hex inválido', async () => {
    const { genres } = await createRepositories();

    expect(() =>
      genres.create({
        name: 'Igual',
        colorLight: '#7B69EE',
        colorDark: '#7B69EE',
      }),
    ).toThrow('O par escuro precisa ser diferente do claro');

    expect(() => genres.update('fantasy', { colorLight: 'roxo' })).toThrow();
  });

  it('conta os livros que usam o gênero', async () => {
    const { genres, books } = await createRepositories();
    books.create({ ...baseBook, id: 'book-1', genreId: 'fantasy' });
    books.create({ ...baseBook, id: 'book-2', genreId: 'fantasy' });

    expect(genres.countBooks('fantasy')).toBe(2);
    expect(genres.countBooks('romance')).toBe(0);
  });

  it('exclui gênero sem livros', async () => {
    const { genres } = await createRepositories();

    expect(genres.remove('romance')).toBe(true);
    expect(genres.findById('romance')).toBeUndefined();
    expect(genres.remove('romance')).toBe(false);
  });

  it('bloqueia a exclusão quando há livros usando', async () => {
    const { genres, books } = await createRepositories();
    books.create({ ...baseBook, id: 'book-1', genreId: 'fantasy' });

    expect(() => genres.remove('fantasy')).toThrow(
      'Este gênero está em 1 livro. Troque o gênero dele antes de excluir.',
    );
    expect(genres.findById('fantasy')).toBeDefined();
  });

  it('nunca deixa apagar o último gênero', async () => {
    const { genres } = await createRepositories();

    for (const id of [
      'fantasy',
      'romance',
      'nonfiction',
      'classic',
      'children',
    ]) {
      genres.remove(id);
    }

    expect(() => genres.remove('horror')).toThrow(
      'Mantenha pelo menos um gênero.',
    );
    expect(genres.list()).toHaveLength(1);
  });
});
