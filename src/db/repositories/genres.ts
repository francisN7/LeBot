import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { validateColorPair } from '@/lib/genre-color';
import { normalizeGenreName } from '@/lib/genre-name';
import { createId } from '@/lib/id';

import { books, type GenreRow, genres } from '../schema';
import type { AppDatabase } from '../types';

const hexField = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase());

const genreFields = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, 'Informe o nome do gênero').max(40),
  colorLight: hexField,
  colorDark: hexField,
  paletteIndex: z.number().int().min(0).max(9).nullable().optional(),
});

export type CreateGenreInput = z.input<typeof genreFields>;
export type GenrePatch = Partial<Omit<CreateGenreInput, 'id'>>;

export type GenresRepository = {
  list(): GenreRow[];
  findById(id: string): GenreRow | undefined;
  countBooks(id: string): number;
  nameExists(name: string, exceptId?: string): boolean;
  create(input: CreateGenreInput): GenreRow;
  update(id: string, patch: GenrePatch): GenreRow | undefined;
  remove(id: string): boolean;
};

const DUPLICATE_NAME = 'Já existe um gênero com este nome';
export const LAST_GENRE_ERROR = 'Mantenha pelo menos um gênero.';

export function booksUsingGenre(count: number): string {
  return count === 1
    ? 'Este gênero está em 1 livro. Troque o gênero dele antes de excluir.'
    : `Este gênero está em ${count} livros. Troque o gênero deles antes de excluir.`;
}

export function createGenresRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): GenresRepository {
  function findByName(name: string, exceptId?: string): GenreRow | undefined {
    const wanted = normalizeGenreName(name);

    return db
      .select()
      .from(genres)
      .all()
      .find(
        (genre) =>
          genre.id !== exceptId && normalizeGenreName(genre.name) === wanted,
      );
  }

  const repository: GenresRepository = {
    list() {
      return db
        .select()
        .from(genres)
        .orderBy(genres.sortOrder, genres.name)
        .all();
    },

    findById(id) {
      return db.select().from(genres).where(eq(genres.id, id)).get();
    },

    countBooks(id) {
      return db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.genreId, id))
        .all().length;
    },

    nameExists(name, exceptId) {
      return findByName(name, exceptId) !== undefined;
    },

    create(input) {
      const parsed = genreFields.parse(input);
      const pair = validateColorPair(parsed.colorLight, parsed.colorDark);

      if (!pair.ok) {
        throw new Error(pair.errors.light ?? pair.errors.dark);
      }

      if (findByName(parsed.name)) {
        throw new Error(DUPLICATE_NAME);
      }

      const last = db
        .select({ sortOrder: genres.sortOrder })
        .from(genres)
        .orderBy(desc(genres.sortOrder))
        .limit(1)
        .get();
      const now = new Date();

      return db
        .insert(genres)
        .values({
          id: parsed.id ?? createId('genre'),
          name: parsed.name,
          colorLight: pair.light,
          colorDark: pair.dark,
          paletteIndex: parsed.paletteIndex ?? null,
          isDefault: false,
          sortOrder: (last?.sortOrder ?? -1) + 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get();
    },

    update(id, patch) {
      const current = repository.findById(id);
      if (!current) {
        return undefined;
      }

      const parsed = genreFields.parse({
        name: current.name,
        colorLight: current.colorLight,
        colorDark: current.colorDark,
        paletteIndex: current.paletteIndex,
        ...patch,
      });
      const pair = validateColorPair(parsed.colorLight, parsed.colorDark);

      if (!pair.ok) {
        throw new Error(pair.errors.light ?? pair.errors.dark);
      }

      if (findByName(parsed.name, id)) {
        throw new Error(DUPLICATE_NAME);
      }

      return db
        .update(genres)
        .set({
          name: parsed.name,
          colorLight: pair.light,
          colorDark: pair.dark,
          paletteIndex: parsed.paletteIndex ?? null,
          updatedAt: new Date(),
        })
        .where(eq(genres.id, id))
        .returning()
        .get();
    },

    remove(id) {
      const current = repository.findById(id);
      if (!current) {
        return false;
      }

      if (repository.list().length <= 1) {
        throw new Error(LAST_GENRE_ERROR);
      }

      const inUse = repository.countBooks(id);
      if (inUse > 0) {
        throw new Error(booksUsingGenre(inUse));
      }

      const deleted = db
        .delete(genres)
        .where(eq(genres.id, id))
        .returning({ id: genres.id })
        .all();

      return deleted.length > 0;
    },
  };

  return repository;
}
