import { fireEvent, screen } from '@testing-library/react-native';

import type { BookRow, ReadingSessionRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReadingSessionsRepository,
} from '@/test-utils/repositories';

import { TimelineScreen } from './TimelineScreen';

const today = new Date(2026, 10, 20, 12); // 20 de novembro de 2026

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  return {
    id: 'book-1',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 75,
    isbn: null,
    coverUri: null,
    createdAt: new Date(2025, 0, 1),
    updatedAt: new Date(2025, 0, 1),
    ...overrides,
  };
}

function sessionRow(
  readAt: Date,
  pages: number,
  id: string,
): ReadingSessionRow {
  return {
    id,
    bookId: 'book-1',
    pages,
    appliedPages: pages,
    readAt,
    createdAt: readAt,
    updatedAt: readAt,
  };
}

describe('TimelineScreen', () => {
  it('mostra os totais e um cartão por ano', async () => {
    const booksRepository = createInMemoryBooksRepository([
      bookRow(),
      bookRow({
        id: 'book-2',
        status: 'finished',
        updatedAt: new Date(2026, 10, 10),
      }),
    ]);
    const readingRepository = createInMemoryReadingSessionsRepository(
      booksRepository,
      [
        sessionRow(new Date(2025, 9, 20), 30, 's-1'),
        sessionRow(new Date(2026, 0, 10), 40, 's-2'),
        sessionRow(new Date(2026, 10, 20), 5, 's-3'),
      ],
    );

    await renderWithProviders(
      <TimelineScreen onBack={jest.fn()} today={today} />,
      {
        booksRepository,
        readingRepository,
      },
    );

    expect(screen.getByText('Linha do tempo')).toBeOnTheScreen();
    expect(screen.getByText('Desde outubro de 2025')).toBeOnTheScreen();
    expect(screen.getByLabelText('75 páginas')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 dias com leitura')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 livro concluído')).toBeOnTheScreen();
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByText('2025')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Janeiro de 2026: 40 páginas'),
    ).toBeOnTheScreen();
  });

  it('volta pelo botão de voltar', async () => {
    const onBack = jest.fn();
    const booksRepository = createInMemoryBooksRepository([bookRow()]);
    const readingRepository = createInMemoryReadingSessionsRepository(
      booksRepository,
      [sessionRow(new Date(2026, 10, 20), 5, 's-1')],
    );

    await renderWithProviders(
      <TimelineScreen onBack={onBack} today={today} />,
      { booksRepository, readingRepository },
    );

    await fireEvent.press(screen.getByText('Voltar'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('sem histórico, mostra o estado vazio', async () => {
    const booksRepository = createInMemoryBooksRepository([]);
    const readingRepository =
      createInMemoryReadingSessionsRepository(booksRepository);

    await renderWithProviders(
      <TimelineScreen onBack={jest.fn()} today={today} />,
      { booksRepository, readingRepository },
    );

    expect(
      screen.getByText('O diário começa quando você lê'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('0 páginas')).not.toBeOnTheScreen();
  });
});
