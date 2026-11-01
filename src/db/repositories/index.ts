import { getDb } from '../client';
import { type BooksRepository, createBooksRepository } from './books';
import { createGenresRepository, type GenresRepository } from './genres';
import { createQueueRepository, type QueueRepository } from './queue';
import {
  createReadingSessionsRepository,
  type ReadingSessionsRepository,
} from './reading-sessions';
import { createSettingsRepository, type SettingsRepository } from './settings';

let booksInstance: BooksRepository | undefined;
let genresInstance: GenresRepository | undefined;
let queueInstance: QueueRepository | undefined;
let readingSessionsInstance: ReadingSessionsRepository | undefined;
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

export function getQueueRepository(): QueueRepository {
  queueInstance ??= createQueueRepository(getDb());
  return queueInstance;
}

export function getReadingSessionsRepository(): ReadingSessionsRepository {
  readingSessionsInstance ??= createReadingSessionsRepository(getDb());
  return readingSessionsInstance;
}

export function getSettingsRepository(): SettingsRepository {
  settingsInstance ??= createSettingsRepository(getDb());
  return settingsInstance;
}

/** Só para testes. */
export function resetRepositoriesForTests(): void {
  booksInstance = undefined;
  genresInstance = undefined;
  queueInstance = undefined;
  readingSessionsInstance = undefined;
  settingsInstance = undefined;
}

export type { BookPatch, BooksRepository, CreateBookInput } from './books';
export type {
  CreateGenreInput,
  GenrePatch,
  GenresRepository,
} from './genres';
export type { QueueRepository } from './queue';
export type {
  CreateReadingSessionInput,
  ReadingSessionRemoval,
  ReadingSessionsRepository,
  ReadingSessionWrite,
} from './reading-sessions';
export type { SettingsRepository } from './settings';
