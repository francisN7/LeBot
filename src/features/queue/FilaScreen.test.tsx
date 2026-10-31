import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  testBookRows,
} from '@/test-utils/repositories';

import { FilaScreen } from './FilaScreen';

describe('FilaScreen', () => {
  it('mostra a próxima leitura e o restante da fila', async () => {
    await renderWithProviders(<FilaScreen />);

    expect(screen.getByText('Fila')).toBeOnTheScreen();
    expect(screen.getByText('Próxima parada')).toBeOnTheScreen();
    expect(screen.getByText('2 livros esperando a sua vez')).toBeOnTheScreen();
    expect(screen.getAllByText('Orgulho e Preconceito').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Coraline').length).toBeGreaterThan(0);
  });

  it('abre o detalhe ao tocar num livro da fila', async () => {
    const onOpenBook = jest.fn();
    await renderWithProviders(<FilaScreen onOpenBook={onOpenBook} />);

    await fireEvent.press(screen.getByLabelText('Abrir Coraline'));

    expect(onOpenBook).toHaveBeenCalledWith('book-coraline');
  });

  it('ignora livro apagado no total e na lista', async () => {
    const withoutCoraline = testBookRows.filter(
      (row) => row.id !== 'book-coraline',
    );

    await renderWithProviders(<FilaScreen />, {
      booksRepository: createInMemoryBooksRepository(withoutCoraline),
    });

    expect(screen.getByText('1 livro esperando a sua vez')).toBeOnTheScreen();
    expect(screen.queryByText('Coraline')).not.toBeOnTheScreen();
  });
});
