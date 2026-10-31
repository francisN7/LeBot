import type { Book } from '../types';

/** Dados fictícios da S1. Nenhum dado pessoal: tudo inventado. */
export const books: Book[] = [
  {
    id: 'book-hobbit',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genre: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 128,
  },
  {
    id: 'book-sapiens',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'nonfiction',
    status: 'reading',
    pages: 464,
    pagesRead: 90,
  },
  {
    id: 'book-orgulho',
    title: 'Orgulho e Preconceito',
    author: 'Jane Austen',
    genre: 'classic',
    status: 'queued',
    pages: 424,
    pagesRead: 0,
  },
  {
    id: 'book-coraline',
    title: 'Coraline',
    author: 'Neil Gaiman',
    genre: 'horror',
    status: 'paused',
    pages: 208,
    pagesRead: 64,
  },
  {
    id: 'book-pequeno-principe',
    title: 'O Pequeno Príncipe',
    author: 'Antoine de Saint-Exupéry',
    genre: 'children',
    status: 'finished',
    pages: 96,
    pagesRead: 96,
  },
];

export function findBookById(id: string): Book | undefined {
  return books.find((book) => book.id === id);
}
