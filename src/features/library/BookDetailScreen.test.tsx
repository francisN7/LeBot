import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { BookRow } from '@/db/schema';
import { createFakeCoverService } from '@/test-utils/covers';
import { renderWithProviders } from '@/test-utils/render';
import { createInMemoryBooksRepository } from '@/test-utils/repositories';

import { BookDetailScreen } from './BookDetailScreen';

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'book-teste',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genre: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 128,
    isbn: '9780306406157',
    coverUri: null,
    createdAt: time,
    updatedAt: time,
    ...overrides,
  };
}

describe('BookDetailScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mostra os dados do livro', async () => {
    const row = bookRow();
    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: createInMemoryBooksRepository([row]) },
    );

    expect(screen.getAllByText('O Hobbit').length).toBeGreaterThan(0);
    expect(screen.getByText('J. R. R. Tolkien')).toBeOnTheScreen();
    expect(screen.getByText('128 de 310')).toBeOnTheScreen();
    expect(screen.getByText('9780306406157')).toBeOnTheScreen();
  });

  it('chama a edição', async () => {
    const row = bookRow();
    const onEdit = jest.fn();
    await renderWithProviders(
      <BookDetailScreen bookId={row.id} onBack={jest.fn()} onEdit={onEdit} />,
      { booksRepository: createInMemoryBooksRepository([row]) },
    );

    await fireEvent.press(screen.getByText('Editar livro'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('exclui só depois da confirmação e apaga a capa', async () => {
    const row = bookRow({ coverUri: 'file:///covers/book-teste.jpg' });
    const repository = createInMemoryBooksRepository([row]);
    const coverService = createFakeCoverService();
    const onBack = jest.fn();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await renderWithProviders(
      <BookDetailScreen bookId={row.id} onBack={onBack} onEdit={jest.fn()} />,
      { booksRepository: repository, coverService },
    );

    await fireEvent.press(screen.getByText('Excluir livro'));

    expect(alert).toHaveBeenCalledTimes(1);
    expect(repository.list()).toHaveLength(1);

    const buttons = alert.mock.calls[0]?.[2] ?? [];
    const confirm = buttons.find((button) => button.text === 'Excluir');

    await act(async () => {
      await confirm?.onPress?.();
    });

    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(repository.list()).toHaveLength(0);
    expect(coverService.removed).toEqual(['file:///covers/book-teste.jpg']);
  });

  it('mostra aviso quando o livro não existe', async () => {
    await renderWithProviders(
      <BookDetailScreen
        bookId="book-sumiu"
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: createInMemoryBooksRepository([]) },
    );

    expect(screen.getByText('Livro não encontrado')).toBeOnTheScreen();
  });
});
