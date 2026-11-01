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

  it('cai na lombada quando o livro não tem capa', async () => {
    await renderWithProviders(<FilaScreen />);

    expect(
      screen.getByLabelText('Lombada de Orgulho e Preconceito'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Lombada de Coraline')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Capa de Coraline')).not.toBeOnTheScreen();
  });

  it('mostra a capa real na próxima parada e em "Depois"', async () => {
    const withCovers = testBookRows.map((row) => ({
      ...row,
      coverUri: `covers/${row.id}.jpg`,
    }));

    await renderWithProviders(<FilaScreen />, {
      booksRepository: createInMemoryBooksRepository(withCovers),
    });

    expect(
      screen.getByLabelText('Capa de Orgulho e Preconceito'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Capa de Coraline')).toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Lombada de Coraline'),
    ).not.toBeOnTheScreen();
  });

  it('abre o registro da próxima parada com as páginas do plano', async () => {
    const books = createInMemoryBooksRepository();

    await renderWithProviders(<FilaScreen />, { booksRepository: books });

    await fireEvent.press(screen.getByText('Começar'));

    expect(screen.getByDisplayValue('20')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(books.findById('book-orgulho')?.pagesRead).toBe(20);
  });

  it('troca o Começar por Concluído quando a próxima parada já foi lida', async () => {
    const rows = testBookRows.map((row) =>
      row.id === 'book-orgulho'
        ? { ...row, pagesRead: row.pages, status: 'finished' as const }
        : row,
    );

    await renderWithProviders(<FilaScreen />, {
      booksRepository: createInMemoryBooksRepository(rows),
    });

    expect(screen.queryByText('Começar')).not.toBeOnTheScreen();
    expect(screen.getAllByText('Concluído').length).toBeGreaterThan(0);
  });
});
