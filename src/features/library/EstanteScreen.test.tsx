import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import {
  createGestureController,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

import type { BookRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryGenresRepository,
  createInMemoryReviewsRepository,
  testGenreRows,
} from '@/test-utils/repositories';

import { EstanteScreen } from './EstanteScreen';

const GESTURE_ID = 'gesture-status-book-hobbit';

function wheelController() {
  return createGestureController(getByGestureTestId(GESTURE_ID));
}

async function closeWheel() {
  await waitFor(() =>
    expect(screen.queryByTestId('status-wheel')).not.toBeOnTheScreen(),
  );
}

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

  it('abre "Meu ritmo" pelo atalho discreto do cabeçalho', async () => {
    const onOpenStats = jest.fn();
    await renderWithProviders(<EstanteScreen onOpenStats={onOpenStats} />);

    await fireEvent.press(screen.getByLabelText('Ver estatísticas de leitura'));

    expect(onOpenStats).toHaveBeenCalledTimes(1);
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

  it('abre a roda no toque longo, não no toque simples', async () => {
    await renderWithProviders(<EstanteScreen />);

    await fireEvent.press(screen.getByTestId('status-book-hobbit'));
    expect(screen.queryByTestId('status-wheel')).not.toBeOnTheScreen();

    const gesture = wheelController();
    await act(async () => {
      gesture.begin({ absoluteX: 200, absoluteY: 400 });
      gesture.activate({ absoluteX: 200, absoluteY: 400 });
    });

    expect(screen.getByTestId('status-wheel')).toBeOnTheScreen();
    expect(screen.getByTestId('status-wheel-reading')).toBeOnTheScreen();

    await act(async () => {
      gesture.end({ absoluteX: 200, absoluteY: 400 });
    });
  });

  it('pré-visualiza ao arrastar e grava ao soltar', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    const gesture = wheelController();
    await act(async () => {
      gesture.begin({ absoluteX: 200, absoluteY: 400 });
      gesture.activate({ absoluteX: 200, absoluteY: 400 });
    });
    await act(async () => {
      gesture.update({ absoluteX: 280, absoluteY: 400 });
    });

    expect(books.findById('book-hobbit')?.status).toBe('reading');
    expect(
      screen.getByTestId('status-wheel-queued').props.accessibilityState,
    ).toEqual({ selected: true });

    await act(async () => {
      gesture.end({ absoluteX: 280, absoluteY: 400 });
    });

    expect(books.findById('book-hobbit')?.status).toBe('queued');
    await closeWheel();
    expect(screen.getByTestId('status-book-hobbit')).toHaveTextContent(
      'Quero ler',
    );
  });

  it('soltar no miolo cancela sem gravar', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    const gesture = wheelController();
    await act(async () => {
      gesture.begin({ absoluteX: 200, absoluteY: 400 });
      gesture.activate({ absoluteX: 200, absoluteY: 400 });
    });
    await act(async () => {
      gesture.update({ absoluteX: 205, absoluteY: 402 });
    });
    await act(async () => {
      gesture.end({ absoluteX: 205, absoluteY: 402 });
    });

    expect(books.findById('book-hobbit')?.status).toBe('reading');
    await closeWheel();
    expect(screen.getByTestId('status-book-hobbit')).toHaveTextContent('Lendo');
  });

  it('concluir pela roda preenche as páginas lidas', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    const gesture = wheelController();
    await act(async () => {
      gesture.begin({ absoluteX: 200, absoluteY: 400 });
      gesture.activate({ absoluteX: 200, absoluteY: 400 });
    });
    await act(async () => {
      gesture.update({ absoluteX: 120, absoluteY: 400 });
    });
    await act(async () => {
      gesture.end({ absoluteX: 120, absoluteY: 400 });
    });

    const updated = books.findById('book-hobbit');
    expect(updated?.status).toBe('finished');
    expect(updated?.pagesRead).toBe(310);
    await closeWheel();
    expect(screen.getByTestId('status-book-hobbit')).toHaveTextContent(
      'Concluído',
    );
  });

  it('abre a roda pela ação acessível e escolhe uma opção', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(
      screen.getByTestId('status-book-hobbit'),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'openStatusWheel' },
      },
    );

    expect(screen.getByTestId('status-wheel')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('status-wheel-queued'));

    expect(books.findById('book-hobbit')?.status).toBe('queued');
    await closeWheel();
  });

  it('tocar fora cancela sem gravar', async () => {
    const books = createInMemoryBooksRepository();
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(
      screen.getByTestId('status-book-hobbit'),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'openStatusWheel' },
      },
    );
    await fireEvent.press(screen.getByTestId('status-wheel-backdrop'));

    expect(books.findById('book-hobbit')?.status).toBe('reading');
    await closeWheel();
  });

  it('escolher o status atual não escreve de novo', async () => {
    const books = createInMemoryBooksRepository();
    const update = jest.spyOn(books, 'update');
    await renderWithProviders(<EstanteScreen />, { booksRepository: books });

    await fireEvent(
      screen.getByTestId('status-book-hobbit'),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'openStatusWheel' },
      },
    );
    await fireEvent.press(screen.getByTestId('status-wheel-reading'));

    expect(update).not.toHaveBeenCalled();
    await closeWheel();
  });

  it('mostra as estrelas no card de livro concluído com resenha', async () => {
    const row = bookRow({ status: 'finished', pagesRead: 310 });
    const books = createInMemoryBooksRepository([row]);
    const reviews = createInMemoryReviewsRepository(books);
    reviews.save({ bookId: row.id, rating: 4 });

    await renderWithProviders(<EstanteScreen />, {
      booksRepository: books,
      reviewsRepository: reviews,
    });

    expect(screen.getByTestId(`resenha-${row.id}`)).toBeOnTheScreen();
    expect(screen.getByLabelText('Nota: 4 de 5 estrelas')).toBeOnTheScreen();
  });

  it('não mostra estrelas enquanto o livro não está concluído', async () => {
    const row = bookRow();
    const books = createInMemoryBooksRepository([row]);
    const reviews = createInMemoryReviewsRepository(books);
    reviews.save({ bookId: row.id, rating: 5 });

    await renderWithProviders(<EstanteScreen />, {
      booksRepository: books,
      reviewsRepository: reviews,
    });

    expect(screen.queryByTestId(`resenha-${row.id}`)).not.toBeOnTheScreen();
  });
});
