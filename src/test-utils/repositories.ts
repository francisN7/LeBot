import type { BooksRepository, SettingsRepository } from '@/db/repositories';
import type { BookRow } from '@/db/schema';
import { seedBooks, seedSettings } from '@/db/seed';

const baseTime = new Date('2026-01-01T00:00:00.000Z').getTime();

/** Linhas equivalentes ao seed, com timestamps fixos para testes estáveis. */
export const testBookRows: BookRow[] = seedBooks.map((book, index) => ({
  id: book.id ?? `book-test-${index}`,
  title: book.title,
  author: book.author,
  genre: book.genre,
  status: book.status,
  pages: book.pages,
  pagesRead: book.pagesRead ?? 0,
  isbn: book.isbn ?? null,
  coverUri: book.coverUri ?? null,
  createdAt: new Date(baseTime + index * 1_000),
  updatedAt: new Date(baseTime + index * 1_000),
}));

/** Repositório em memória para testar telas sem abrir SQLite. */
export function createInMemoryBooksRepository(
  rows: BookRow[] = testBookRows,
): BooksRepository {
  let current = rows.map((row) => ({ ...row }));
  let nextId = 0;

  function assertIsbnAvailable(
    isbn: string | null | undefined,
    exceptId?: string,
  ): void {
    if (!isbn) {
      return;
    }

    const duplicated = current.some(
      (row) => row.isbn === isbn && row.id !== exceptId,
    );

    if (duplicated) {
      throw new Error('Já existe um livro com este ISBN');
    }
  }

  return {
    list() {
      return [...current];
    },

    findById(id) {
      return current.find((row) => row.id === id);
    },

    create(input) {
      assertIsbnAvailable(input.isbn);
      const now = new Date();
      const row: BookRow = {
        id: input.id ?? `book-fake-${nextId++}`,
        title: input.title,
        author: input.author,
        genre: input.genre,
        status: input.status,
        pages: input.pages,
        pagesRead: input.pagesRead ?? 0,
        isbn: input.isbn ?? null,
        coverUri: input.coverUri ?? null,
        createdAt: now,
        updatedAt: now,
      };
      current.push(row);
      return row;
    },

    update(id, patch) {
      const index = current.findIndex((row) => row.id === id);
      const existing = current[index];
      if (!existing) {
        return undefined;
      }

      const updated: BookRow = {
        ...existing,
        ...patch,
        isbn: patch.isbn === undefined ? existing.isbn : patch.isbn,
        coverUri:
          patch.coverUri === undefined ? existing.coverUri : patch.coverUri,
        updatedAt: new Date(),
      };
      assertIsbnAvailable(updated.isbn, id);
      current[index] = updated;
      return updated;
    },

    remove(id) {
      const before = current.length;
      current = current.filter((row) => row.id !== id);
      return current.length < before;
    },
  };
}

export function createInMemorySettingsRepository(
  initial: Record<string, string> = seedSettings,
): SettingsRepository {
  const values = new Map(Object.entries(initial));

  return {
    get(key) {
      return values.get(key);
    },
    all() {
      return Object.fromEntries(values);
    },
    set(key, value) {
      values.set(key, value);
    },
    remove(key) {
      return values.delete(key);
    },
  };
}
