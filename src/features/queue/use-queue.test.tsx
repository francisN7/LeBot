import { fireEvent, screen } from '@testing-library/react-native';

import { AppText, Button } from '@/components/ui';
import type { QueueItemRow } from '@/db/schema';
import { useDailyPlan } from '@/features/today/use-daily-plan';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryQueueRepository,
  testBookRows,
} from '@/test-utils/repositories';

import { useQueue } from './use-queue';

function queueRows(...bookIds: string[]): QueueItemRow[] {
  return bookIds.map((bookId, position) => ({
    bookId,
    position,
    note: null,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
  }));
}

/** Mostra o primeiro bloco do plano e move B para o início da Ordem. */
function PlanProbe() {
  const { move } = useQueue();
  const { view } = useDailyPlan(new Date(2026, 9, 30));

  return (
    <>
      <Button label="Mover B para o início" onPress={() => move('book-b', 0)} />
      <AppText testID="plan-order">
        {view.blocks.map((block) => block.book.id).join(',')}
      </AppText>
    </>
  );
}

describe('useQueue', () => {
  it('reordenar muda a ordem que o plano da Hoje usa', async () => {
    const base = testBookRows[0];

    if (!base) {
      throw new Error('Seed de teste sem livro base');
    }

    const books = [
      { ...base, id: 'book-a', title: 'A', genreId: 'fantasy' },
      { ...base, id: 'book-b', title: 'B', genreId: 'nonfiction' },
    ];
    const booksRepository = createInMemoryBooksRepository(books);
    const queueRepository = createInMemoryQueueRepository(
      booksRepository,
      queueRows('book-a', 'book-b'),
    );

    await renderWithProviders(<PlanProbe />, {
      booksRepository,
      queueRepository,
    });

    expect(screen.getByTestId('plan-order')).toHaveTextContent(/^book-a/);

    await fireEvent.press(screen.getByLabelText('Mover B para o início'));

    expect(screen.getByTestId('plan-order')).toHaveTextContent(/^book-b/);
  });
});
