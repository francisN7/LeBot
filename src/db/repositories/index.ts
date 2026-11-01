import { getDb } from '../client';
import { type BackupRepository, createBackupRepository } from './backup';
import { type BooksRepository, createBooksRepository } from './books';
import { createGenresRepository, type GenresRepository } from './genres';
import { createQueueRepository, type QueueRepository } from './queue';
import {
  createReadingSessionsRepository,
  type ReadingSessionsRepository,
} from './reading-sessions';
import {
  createReviewFieldsRepository,
  type ReviewFieldsRepository,
} from './review-fields';
import { createReviewsRepository, type ReviewsRepository } from './reviews';
import { createSettingsRepository, type SettingsRepository } from './settings';

let backupInstance: BackupRepository | undefined;
let booksInstance: BooksRepository | undefined;
let genresInstance: GenresRepository | undefined;
let queueInstance: QueueRepository | undefined;
let readingSessionsInstance: ReadingSessionsRepository | undefined;
let reviewFieldsInstance: ReviewFieldsRepository | undefined;
let reviewsInstance: ReviewsRepository | undefined;
let settingsInstance: SettingsRepository | undefined;

/** Repositório real, criado sob demanda (importar o módulo não abre o banco). */
export function getBackupRepository(): BackupRepository {
  backupInstance ??= createBackupRepository(getDb());
  return backupInstance;
}

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

export function getReviewFieldsRepository(): ReviewFieldsRepository {
  reviewFieldsInstance ??= createReviewFieldsRepository(getDb());
  return reviewFieldsInstance;
}

export function getReviewsRepository(): ReviewsRepository {
  reviewsInstance ??= createReviewsRepository(getDb());
  return reviewsInstance;
}

export function getSettingsRepository(): SettingsRepository {
  settingsInstance ??= createSettingsRepository(getDb());
  return settingsInstance;
}

/** Só para testes. */
export function resetRepositoriesForTests(): void {
  backupInstance = undefined;
  booksInstance = undefined;
  genresInstance = undefined;
  queueInstance = undefined;
  readingSessionsInstance = undefined;
  reviewFieldsInstance = undefined;
  reviewsInstance = undefined;
  settingsInstance = undefined;
}

export type {
  BackupCounts,
  BackupRepository,
  BackupTables,
} from './backup';
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
export type {
  CreateReviewFieldInput,
  ReviewFieldsRepository,
} from './review-fields';
export type { ReviewsRepository, SaveReviewInput } from './reviews';
export type { SettingsRepository } from './settings';
