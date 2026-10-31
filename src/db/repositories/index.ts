import { getDb } from '../client';
import { type BooksRepository, createBooksRepository } from './books';
import { createGenresRepository, type GenresRepository } from './genres';
import { createSettingsRepository, type SettingsRepository } from './settings';

let booksInstance: BooksRepository | undefined;
let genresInstance: GenresRepository | undefined;
let settingsInstance: SettingsRepository | undefined;

/** Repositório real, criado sob demanda (importar o módulo não abre o banco). */
export function getBooksRepository(): BooksRepository {
  booksInstance ??= createBooksRepository(getDb());
  return booksInstance;
}

export function getGenresRepository(): GenresRepository {
  genresInstance ??= createGenresRepository(getDb());
  return genresInstance;
}

export function getSettingsRepository(): SettingsRepository {
  settingsInstance ??= createSettingsRepository(getDb());
  return settingsInstance;
}

/** Só para testes. */
export function resetRepositoriesForTests(): void {
  booksInstance = undefined;
  genresInstance = undefined;
  settingsInstance = undefined;
}

export type { BookPatch, BooksRepository, CreateBookInput } from './books';
export type {
  CreateGenreInput,
  GenrePatch,
  GenresRepository,
} from './genres';
export type { SettingsRepository } from './settings';
