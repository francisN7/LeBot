import type { BooksRepository, CreateBookInput } from './repositories/books';
import type { SettingsRepository } from './repositories/settings';

/** Marca que o seed já rodou, para não repor livros que o dono apagar. */
export const SEED_FLAG = 'seed.books.version';
export const SEED_VERSION = '1';

/**
 * Livros fictícios da S1. Servem só para o app não abrir vazio no primeiro uso
 * e nunca são dados reais do dono.
 */
export const seedBooks: CreateBookInput[] = [
  {
    id: 'book-hobbit',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 128,
  },
  {
    id: 'book-sapiens',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genreId: 'nonfiction',
    status: 'reading',
    pages: 464,
    pagesRead: 90,
  },
  {
    id: 'book-orgulho',
    title: 'Orgulho e Preconceito',
    author: 'Jane Austen',
    genreId: 'classic',
    status: 'queued',
    pages: 424,
    pagesRead: 0,
  },
  {
    id: 'book-coraline',
    title: 'Coraline',
    author: 'Neil Gaiman',
    genreId: 'horror',
    status: 'paused',
    pages: 208,
    pagesRead: 64,
  },
  {
    id: 'book-pequeno-principe',
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    genreId: 'children',
    status: 'finished',
    pages: 96,
    pagesRead: 96,
  },
];

/** Preferências iniciais, só na primeira execução. */
export const seedSettings: Record<string, string> = {
  'goal.pages': '18',
  'reminder.time': '20:00',
  'appearance.theme': 'light',
  'backup.enabled': 'false',
};

/**
 * Roda só em banco vazio e uma única vez (o flag impede repor dados apagados).
 * Devolve `true` quando inseriu os livros de exemplo.
 */
export function seedIfEmpty(
  books: BooksRepository,
  settings: SettingsRepository,
): boolean {
  if (settings.get(SEED_FLAG) === SEED_VERSION) {
    return false;
  }

  if (books.list().length > 0) {
    return false;
  }

  for (const book of seedBooks) {
    books.create(book);
  }

  for (const [key, value] of Object.entries(seedSettings)) {
    settings.set(key, value);
  }

  settings.set(SEED_FLAG, SEED_VERSION);
  return true;
}
