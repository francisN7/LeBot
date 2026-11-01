import type {
  BooksRepository,
  GenresRepository,
  ReadingSessionsRepository,
  SettingsRepository,
} from '@/db/repositories';
import { booksUsingGenre } from '@/db/repositories/genres';
import type { QueueRepository } from '@/db/repositories/queue';
import type {
  BookRow,
  GenreRow,
  QueueItemRow,
  ReadingSessionRow,
} from '@/db/schema';
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

/**
 * Ordem inicial dos testes: a mesma sequência que as telas viam antes da S8,
 * agora gravada como linhas de verdade. É dado de teste, não fixture do app.
 */
export const testQueueRows: QueueItemRow[] = [
  {
    bookId: 'book-orgulho',
    position: 0,
    note: 'Clássico leve para alternar com a não-ficção',
    createdAt: new Date(baseTime + 10_000),
    updatedAt: new Date(baseTime + 10_000),
  },
  {
    bookId: 'book-coraline',
    position: 1,
    note: 'Retomada curta depois do Hobbit',
    createdAt: new Date(baseTime + 11_000),
    updatedAt: new Date(baseTime + 11_000),
  },
];

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

/** Repositório em memória da ordem: mesma transação e mesmas regras do real. */
export function createInMemoryQueueRepository(
  booksRepository: BooksRepository,
  rows: QueueItemRow[] = testQueueRows,
): QueueRepository {
  let current = rows.map((row) => ({ ...row }));

  function validBookIds(): Set<string> {
    return new Set(
      booksRepository
        .list()
        .filter((book) => book.status !== 'finished')
        .map((book) => book.id),
    );
  }

  function visible(): QueueItemRow[] {
    const valid = validBookIds();

    return current
      .filter((row) => valid.has(row.bookId))
      .sort(
        (first, second) =>
          first.position - second.position ||
          first.bookId.localeCompare(second.bookId),
      );
  }

  function normalizeIds(bookIds: readonly string[]): string[] {
    const valid = validBookIds();
    const seen = new Set<string>();

    return bookIds.filter((bookId) => {
      if (!valid.has(bookId) || seen.has(bookId)) {
        return false;
      }

      seen.add(bookId);
      return true;
    });
  }

  function writeOrder(bookIds: readonly string[]): QueueItemRow[] {
    const desired = normalizeIds(bookIds);
    const wanted = new Set(desired);
    const existing = new Map(current.map((row) => [row.bookId, row] as const));
    const now = new Date();

    current = current.filter((row) => wanted.has(row.bookId));

    desired.forEach((bookId, position) => {
      const row = existing.get(bookId);

      if (!row) {
        current.push({
          bookId,
          position,
          note: null,
          createdAt: now,
          updatedAt: now,
        });
        return;
      }

      row.position = position;
      row.updatedAt = now;
    });

    return visible();
  }

  return {
    list() {
      return visible();
    },

    add(bookId, note) {
      const book = booksRepository.findById(bookId);

      if (!book) {
        throw new Error('Livro não encontrado');
      }

      if (book.status === 'finished') {
        throw new Error('Livro concluído não entra na ordem');
      }

      const currentIds = visible().map((row) => row.bookId);
      writeOrder(
        currentIds.includes(bookId) ? currentIds : [...currentIds, bookId],
      );

      if (note !== undefined && note !== null) {
        const row = current.find((item) => item.bookId === bookId);

        if (row) {
          row.note = note.trim();
          row.updatedAt = new Date();
        }
      }

      const row = current.find((item) => item.bookId === bookId);

      if (!row) {
        throw new Error('Livro não encontrado');
      }

      return { ...row };
    },

    remove(bookId) {
      const currentIds = visible().map((row) => row.bookId);
      const next = currentIds.filter((id) => id !== bookId);
      writeOrder(next);
      return next.length !== currentIds.length;
    },

    move(bookId, toPosition) {
      const currentIds = visible().map((row) => row.bookId);
      const from = currentIds.indexOf(bookId);

      if (from < 0) {
        return writeOrder(currentIds);
      }

      const target = Math.min(
        Math.max(Number.isFinite(toPosition) ? toPosition : from, 0),
        currentIds.length - 1,
      );
      const next = [...currentIds];
      next.splice(from, 1);
      next.splice(target, 0, bookId);

      return writeOrder(next);
    },

    replaceAll(bookIds) {
      return writeOrder(bookIds);
    },
  };
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

    latest() {
      return sortedDescending(current)[0];
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
        // Mesma regra do repositório real (ADR 0015).
        status:
          book.pagesRead + appliedPages >= book.pages ? 'finished' : 'reading',
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
