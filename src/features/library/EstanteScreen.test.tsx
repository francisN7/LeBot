import { fireEvent, screen } from '@testing-library/react-native';

import type { BookRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import { createInMemoryBooksRepository } from '@/test-utils/repositories';

import { EstanteScreen } from './EstanteScreen';

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'book-teste',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genre: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 0,
    isbn: null,
    coverUri: null,
    createdAt: time,
    updatedAt: time,
    ...overrides,
  };
}

describe('EstanteScreen', () => {
  it('lista os livros da estante', async () => {
    await renderWithProviders(<EstanteScreen />);

    expect(screen.getByText('Estante')).toBeOnTheScreen();
    expect(screen.getByText('O Hobbit')).toBeOnTheScreen();
    expect(screen.getByText('Sapiens')).toBeOnTheScreen();
  });

  it('filtra a estante por status', async () => {
    await renderWithProviders(<EstanteScreen />);

    await fireEvent.press(screen.getByText('Concluídos'));

    expect(screen.getByText('O Pequeno Príncipe')).toBeOnTheScreen();
    expect(screen.queryByText('O Hobbit')).not.toBeOnTheScreen();
  });

  it('busca por título e por autor', async () => {
    await renderWithProviders(<EstanteScreen />);
    const search = screen.getByLabelText('Buscar');

    await fireEvent.changeText(search, 'principe');

    expect(screen.getByText('O Pequeno Príncipe')).toBeOnTheScreen();
    expect(screen.queryByText('O Hobbit')).not.toBeOnTheScreen();

    await fireEvent.changeText(search, 'tolkien');

    expect(screen.getByText('O Hobbit')).toBeOnTheScreen();
    expect(screen.queryByText('Sapiens')).not.toBeOnTheScreen();
  });

  it('busca por ISBN', async () => {
    await renderWithProviders(<EstanteScreen />, {
      booksRepository: createInMemoryBooksRepository([
        bookRow({ isbn: '9780306406157' }),
      ]),
    });

    await fireEvent.changeText(screen.getByLabelText('Buscar'), '40615');
    expect(screen.getByText('O Hobbit')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Buscar'), 'coraline');
    expect(screen.queryByText('O Hobbit')).not.toBeOnTheScreen();
    expect(
      screen.getByText(
        'Nenhum livro encontrado. Tente outro título, autor ou ISBN.',
      ),
    ).toBeOnTheScreen();
  });

  it('abre o cadastro pelo botão Novo livro', async () => {
    const onCreateBook = jest.fn();
    await renderWithProviders(<EstanteScreen onCreateBook={onCreateBook} />);

    await fireEvent.press(screen.getByText('Novo livro'));

    expect(onCreateBook).toHaveBeenCalledTimes(1);
  });

  it('abre o detalhe ao tocar na lombada', async () => {
    const onOpenBook = jest.fn();
    await renderWithProviders(<EstanteScreen onOpenBook={onOpenBook} />);

    await fireEvent.press(screen.getByLabelText('Lombada de O Hobbit'));

    expect(onOpenBook).toHaveBeenCalledWith('book-hobbit');
  });
});
