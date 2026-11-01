import { fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { BookRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryGenresRepository,
  testGenreRows,
} from '@/test-utils/repositories';

import { EstanteScreen } from './EstanteScreen';
import { STATUS_ITEM_HEIGHT } from './status-wheel';

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'book-teste',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
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

  it('usa a capa no lugar da lombada quando o livro tem uma', async () => {
    await renderWithProviders(<EstanteScreen />, {
      booksRepository: createInMemoryBooksRepository([
        bookRow({ coverUri: 'file:///covers/book-teste.jpg' }),
      ]),
    });

    expect(screen.getByLabelText('Capa de O Hobbit')).toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Lombada de O Hobbit'),
    ).not.toBeOnTheScreen();
  });

  it('usa nome e cor do gênero vindos do banco', async () => {
    const genres = createInMemoryGenresRepository(
      testGenreRows.map((genre) =>
        genre.id === 'fantasy'
          ? { ...genre, name: 'Fantasia épica', colorLight: '#123456' }
          : genre,
      ),
    );

    await renderWithProviders(<EstanteScreen />, { genresRepository: genres });

    expect(screen.getByText('Fantasia épica')).toBeOnTheScreen();

    const spine = screen.getByLabelText('Lombada de O Hobbit');
    const style = StyleSheet.flatten(spine.props.style);

    expect(style.backgroundColor).toBe('#123456');
  });

  it('mostra o mascote neutro quando a estante está vazia', async () => {
    await renderWithProviders(<EstanteScreen />, {
      booksRepository: createInMemoryBooksRepository([]),
    });

    expect(screen.getByLabelText('LêBot, o robô leitor')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Sua estante está vazia. Toque em Novo livro para começar.',
      ),
    ).toBeOnTheScreen();
  });

  it('mostra o mascote pensando quando a busca não encontra nada', async () => {
    await renderWithProviders(<EstanteScreen />);

    await fireEvent.changeText(screen.getByLabelText('Buscar'), 'zzz');

    expect(screen.getByLabelText('LêBot pensando')).toBeOnTheScreen();
  });

  it('abre a roda no toque longo (e não no toque simples)', async () => {
    await renderWithProviders(<EstanteScreen />);
    const chip = screen.getByTestId('status-book-hobbit');

    await fireEvent.press(chip);
    expect(screen.queryByTestId('quick-status-folha')).not.toBeOnTheScreen();

    await fireEvent(chip, 'longPress');

    expect(screen.getByTestId('quick-status-folha')).toBeOnTheScreen();
    expect(screen.getByTestId('roda-status')).toHaveProp(
      'accessibilityRole',
      'adjustable',
    );
  });

  it('abre a roda pela ação acessível do chip', async () => {
    await renderWithProviders(<EstanteScreen />);

    await fireEvent(
      screen.getByTestId('status-book-hobbit'),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'openStatusWheel' },
      },
    );

    expect(screen.getByTestId('quick-status-folha')).toBeOnTheScreen();
  });

  it('pré-visualiza ao deslizar e grava ao soltar', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(screen.getByTestId('status-book-hobbit'), 'longPress');
    await fireEvent.scroll(screen.getByTestId('roda-status'), {
      nativeEvent: { contentOffset: { y: STATUS_ITEM_HEIGHT } },
    });

    expect(screen.getByTestId('previa-status-rotulo')).toHaveTextContent(
      'Quero ler',
    );
    expect(books.findById('book-hobbit')?.status).toBe('reading');

    await fireEvent(screen.getByTestId('roda-status'), 'scrollEndDrag', {
      nativeEvent: { contentOffset: { y: STATUS_ITEM_HEIGHT } },
    });

    expect(screen.queryByTestId('quick-status-folha')).not.toBeOnTheScreen();
    expect(books.findById('book-hobbit')?.status).toBe('queued');
    expect(screen.getByTestId('status-book-hobbit')).toHaveTextContent(
      'Quero ler',
    );
  });

  it('cancelar mantém o status anterior', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(screen.getByTestId('status-book-hobbit'), 'longPress');
    await fireEvent.scroll(screen.getByTestId('roda-status'), {
      nativeEvent: { contentOffset: { y: STATUS_ITEM_HEIGHT * 2 } },
    });
    expect(screen.getByTestId('previa-status-rotulo')).toHaveTextContent(
      'Pausado',
    );

    await fireEvent.press(screen.getByText('Cancelar'));

    expect(screen.queryByTestId('quick-status-folha')).not.toBeOnTheScreen();
    expect(books.findById('book-hobbit')?.status).toBe('reading');
    expect(screen.getByTestId('status-book-hobbit')).toHaveTextContent('Lendo');
  });

  it('tocar fora também cancela sem gravar', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(screen.getByTestId('status-book-hobbit'), 'longPress');
    await fireEvent.press(screen.getByTestId('quick-status-fora'));

    expect(screen.queryByTestId('quick-status-folha')).not.toBeOnTheScreen();
    expect(books.findById('book-hobbit')?.status).toBe('reading');
  });

  it('roda ajustável confirma pelo leitor de tela', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(screen.getByTestId('status-book-hobbit'), 'longPress');
    await fireEvent(screen.getByTestId('roda-status'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(books.findById('book-hobbit')?.status).toBe('queued');
    expect(screen.queryByTestId('quick-status-folha')).not.toBeOnTheScreen();
  });

  it('escolher o status atual fecha sem escrever de novo', async () => {
    const books = createInMemoryBooksRepository();
    const update = jest.spyOn(books, 'update');
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(screen.getByTestId('status-book-hobbit'), 'longPress');
    await fireEvent.press(screen.getByTestId('roda-status-reading'));

    expect(update).not.toHaveBeenCalled();
    expect(screen.queryByTestId('quick-status-folha')).not.toBeOnTheScreen();
  });

  it('concluir pela roda preenche as páginas lidas', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(screen.getByTestId('status-book-hobbit'), 'longPress');
    await fireEvent.press(screen.getByTestId('roda-status-finished'));

    const updated = books.findById('book-hobbit');
    expect(updated?.status).toBe('finished');
    expect(updated?.pagesRead).toBe(310);
    expect(screen.getByTestId('status-book-hobbit')).toHaveTextContent(
      'Concluído',
    );
  });
});
