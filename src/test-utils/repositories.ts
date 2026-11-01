import type {
  BooksRepository,
  GenresRepository,
  ReadingSessionsRepository,
  SettingsRepository,
} from '@/db/repositories';
import { booksUsingGenre } from '@/db/repositories/genres';
import type { BookRow, GenreRow, ReadingSessionRow } from '@/db/schema';
import { seedBooks, seedSettings } from '@/db/seed';
import { normalizeGenreName } from '@/lib/genre-name';

const baseTime = new Date('2026-01-01T00:00:00.000Z').getTime();

/** Linhas equivalentes ao seed, com timestamps fixos para testes estáveis. */
export const testBookRows: BookRow[] = seedBooks.map((book, index) => ({
  id: book.id ?? `book-test-${index}`,
  title: book.title,
  author: book.author,
  genreId: book.genreId,
  status: book.status,
  pages: book.pages,
  pagesRead: book.pagesRead ?? 0,
  isbn: book.isbn ?? null,
  coverUri: book.coverUri ?? null,
  createdAt: new Date(baseTime + index * 1_000),
  updatedAt: new Date(baseTime + index * 1_000),
}));

/** Os 6 gêneros de fábrica, iguais aos que a migração `0002` insere. */
const defaultGenreSeeds: Omit<GenreRow, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'fantasy',
    name: 'Fantasia',
    colorLight: '#7B69EE',
    colorDark: '#B3A7FF',
    paletteIndex: 0,
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: 'romance',
    name: 'Romance',
    colorLight: '#FF6B5B',
    colorDark: '#FF9A8F',
    paletteIndex: 1,
    isDefault: true,
    sortOrder: 1,
  },
  {
    id: 'nonfiction',
    name: 'Não-ficção',
    colorLight: '#34C6B8',
    colorDark: '#6FE3D6',
    paletteIndex: 2,
    isDefault: true,
    sortOrder: 2,
  },
  {
    id: 'classic',
    name: 'Clássico',
    colorLight: '#2A2340',
    colorDark: '#8B84A8',
    paletteIndex: 3,
    isDefault: true,
    sortOrder: 3,
  },
  {
    id: 'children',
    name: 'Infantojuvenil',
    colorLight: '#FFC145',
    colorDark: '#FFD980',
    paletteIndex: 4,
    isDefault: true,
    sortOrder: 4,
  },
  {
    id: 'horror',
    name: 'Terror',
    colorLight: '#FF8FA3',
    colorDark: '#FFB3C1',
    paletteIndex: 5,
    isDefault: true,
    sortOrder: 5,
  },
];

export const testGenreRows: GenreRow[] = defaultGenreSeeds.map(
  (row, index) => ({
    ...row,
    createdAt: new Date(baseTime + index * 1_000),
    updatedAt: new Date(baseTime + index * 1_000),
  }),
);

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
        genreId: input.genreId,
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

export function createInMemoryGenresRepository(
  rows: GenreRow[] = testGenreRows,
  countBooks: (genreId: string) => number = () => 0,
): GenresRepository {
  let current = rows.map((row) => ({ ...row }));
  let nextId = 0;

  function findByName(name: string, exceptId?: string) {
    const wanted = normalizeGenreName(name);
    return current.find(
      (row) => row.id !== exceptId && normalizeGenreName(row.name) === wanted,
    );
  }

  const repository: GenresRepository = {
    list() {
      return [...current].sort(
        (first, second) => first.sortOrder - second.sortOrder,
      );
    },

    findById(id) {
      return current.find((row) => row.id === id);
    },

    countBooks,

    nameExists(name, exceptId) {
      return findByName(name, exceptId) !== undefined;
    },

    create(input) {
      if (findByName(input.name)) {
        throw new Error('Já existe um gênero com este nome');
      }

      const now = new Date();
      const row: GenreRow = {
        id: input.id ?? `genre-fake-${nextId++}`,
        name: input.name,
        colorLight: input.colorLight,
        colorDark: input.colorDark,
        paletteIndex: input.paletteIndex ?? null,
        isDefault: false,
        sortOrder: current.length,
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

      const name = patch.name ?? existing.name;

      if (findByName(name, id)) {
        throw new Error('Já existe um gênero com este nome');
      }

      const updated: GenreRow = {
        ...existing,
        ...patch,
        name,
        paletteIndex:
          patch.paletteIndex === undefined
            ? existing.paletteIndex
            : patch.paletteIndex,
        updatedAt: new Date(),
      };
      current[index] = updated;
      return updated;
    },

    remove(id) {
      if (!current.some((row) => row.id === id)) {
        return false;
      }

      if (current.length <= 1) {
        throw new Error('Mantenha pelo menos um gênero.');
      }

      if (countBooks(id) > 0) {
        throw new Error(booksUsingGenre(countBooks(id)));
      }

      const before = current.length;
      current = current.filter((row) => row.id !== id);
      return current.length < before;
    },
  };

  return repository;
}

/** Repositório em memória da leitura: mexe no mesmo repositório de livros. */
export function createInMemoryReadingSessionsRepository(
  booksRepository: BooksRepository,
  rows: ReadingSessionRow[] = [],
): ReadingSessionsRepository {
  let current = rows.map((row) => ({ ...row }));
  let nextId = 0;

  function sortedDescending(list: ReadingSessionRow[]) {
    return [...list].sort(
      (first, second) =>
        second.readAt.getTime() - first.readAt.getTime() ||
        second.id.localeCompare(first.id),
    );
  }

  return {
    listByBook(bookId) {
      return sortedDescending(current.filter((row) => row.bookId === bookId));
    },

    listBetween(from, to) {
      return [...current]
        .filter((row) => row.readAt >= from && row.readAt <= to)
        .sort(
          (first, second) =>
            first.readAt.getTime() - second.readAt.getTime() ||
            first.id.localeCompare(second.id),
        );
    },

    create(input) {
      if (!Number.isInteger(input.pages) || input.pages <= 0) {
        throw new Error('Informe pelo menos 1 página');
      }

      const book = booksRepository.findById(input.bookId);

      if (!book) {
        throw new Error('Livro não encontrado');
      }

      const remaining = book.pages - book.pagesRead;

      if (remaining <= 0) {
        throw new Error('Este livro já está no fim');
      }

      const now = new Date();
      const appliedPages = Math.min(input.pages, remaining);
      const row: ReadingSessionRow = {
        id: `reading-fake-${nextId++}`,
        bookId: input.bookId,
        pages: input.pages,
        appliedPages,
        readAt: input.readAt ?? now,
        createdAt: now,
        updatedAt: now,
      };
      current.push(row);

      const updated = booksRepository.update(book.id, {
        pagesRead: book.pagesRead + appliedPages,
        status:
          book.pagesRead + appliedPages >= book.pages
            ? 'finished'
            : book.status,
      });

      return { session: row, book: updated ?? book, appliedPages };
    },

    remove(id) {
      const session = current.find((row) => row.id === id);

      if (!session) {
        return undefined;
      }

      current = current.filter((row) => row.id !== id);
      const book = booksRepository.findById(session.bookId);

      if (!book) {
        return { session, book: undefined, appliedPages: 0 };
      }

      const appliedPages = Math.min(
        session.appliedPages ?? session.pages,
        book.pagesRead,
      );
      const pagesRead = book.pagesRead - appliedPages;
      const updated = booksRepository.update(book.id, {
        pagesRead,
        status:
          book.status === 'finished' && pagesRead < book.pages
            ? 'reading'
            : book.status,
      });

      return { session, book: updated, appliedPages };
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
