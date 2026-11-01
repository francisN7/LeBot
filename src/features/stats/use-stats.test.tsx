import { act, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Button } from '@/components/ui';
import type { BookRow, ReadingSessionRow } from '@/db/schema';
import { useReadingSessions } from '@/features/reading/use-reading-sessions';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReadingSessionsRepository,
} from '@/test-utils/repositories';

import { useStats } from './use-stats';

const today = new Date(2026, 10, 1, 12);
const stamp = new Date(2026, 9, 1);

function bookRow(): BookRow {
  return {
    id: 'book-1',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 100,
    pagesRead: 10,
    isbn: null,
    coverUri: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

const sessionRow: ReadingSessionRow = {
  id: 's-1',
  bookId: 'book-1',
  pages: 10,
  appliedPages: 10,
  readAt: today,
  createdAt: stamp,
  updatedAt: stamp,
};

function Probe() {
  const stats = useStats('1m', today);
  const { register } = useReadingSessions('book-1');

  return (
    <>
      <Text testID="pages">{stats.pages}</Text>
      <Button label="Registrar" onPress={() => register(7, today)} />
    </>
  );
}

describe('useStats', () => {
  it('recalcula quando uma sessão é registrada', async () => {
    const booksRepository = createInMemoryBooksRepository([bookRow()]);
    const readingRepository = createInMemoryReadingSessionsRepository(
      booksRepository,
      [sessionRow],
    );

    await renderWithProviders(<Probe />, {
      booksRepository,
      readingRepository,
    });

    expect(screen.getByTestId('pages')).toHaveTextContent('10');

    await act(async () => {
      await fireEvent.press(screen.getByText('Registrar'));
    });

    expect(screen.getByTestId('pages')).toHaveTextContent('17');
  });
});
