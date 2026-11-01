import {
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import type { BookRow, ReadingSessionRow } from '@/db/schema';
import { createFakeCoverService } from '@/test-utils/covers';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReadingSessionsRepository,
  createInMemoryReviewsRepository,
} from '@/test-utils/repositories';

import { BookDetailScreen } from './BookDetailScreen';

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'book-teste',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
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

  it('usa a lombada 3D do status no detalhe', async () => {
    const row = bookRow();
    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: createInMemoryBooksRepository([row]) },
    );

    expect(screen.getByTestId('detalhe-lombada-art')).toBeOnTheScreen();
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

    await renderWithProviders(
      <BookDetailScreen bookId={row.id} onBack={onBack} onEdit={jest.fn()} />,
      { booksRepository: repository, coverService },
    );

    await fireEvent.press(screen.getByText('Excluir livro'));

    expect(screen.getByText('Excluir livro?')).toBeOnTheScreen();
    expect(repository.list()).toHaveLength(1);

    await fireEvent.press(screen.getByText('Cancelar'));
    expect(screen.queryByText('Excluir livro?')).not.toBeOnTheScreen();
    expect(repository.list()).toHaveLength(1);

    await fireEvent.press(screen.getByText('Excluir livro'));
    await fireEvent.press(screen.getByText('Excluir'));

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

  it('mostra o progresso e registra leitura na hora', async () => {
    const row = bookRow();
    const books = createInMemoryBooksRepository([row]);

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: books },
    );

    expect(screen.getByText('128 páginas lidas')).toBeOnTheScreen();
    expect(screen.getByTestId('progresso-barra')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Registrar leitura'));
    await fireEvent.changeText(screen.getByLabelText('Páginas lidas'), '20');
    await fireEvent.press(screen.getByText('Salvar'));

    expect(screen.getByText('148 páginas lidas')).toBeOnTheScreen();
    expect(books.findById(row.id)?.pagesRead).toBe(148);
    expect(screen.queryByTestId('reading-form')).not.toBeOnTheScreen();
  });

  it('conclui o livro ao chegar no total', async () => {
    const row = bookRow({ pagesRead: 300 });
    const books = createInMemoryBooksRepository([row]);

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: books },
    );

    await fireEvent.press(screen.getByText('Registrar leitura'));
    await fireEvent.changeText(screen.getByLabelText('Páginas lidas'), '25');

    expect(
      screen.getByText(
        'Só faltam 10 páginas: o progresso para no fim do livro.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(screen.getByText('310 páginas lidas')).toBeOnTheScreen();
    expect(screen.getByText('Livro concluído.')).toBeOnTheScreen();
    expect(screen.getByText('Concluído')).toBeOnTheScreen();
    expect(screen.queryByText('Registrar leitura')).not.toBeOnTheScreen();
    expect(books.findById(row.id)?.status).toBe('finished');
  });

  it('lista as últimas leituras e desfaz depois da confirmação', async () => {
    const row = bookRow({ pagesRead: 148 });
    const books = createInMemoryBooksRepository([row]);
    const time = new Date('2026-10-30T10:00:00.000Z');
    const sessions: ReadingSessionRow[] = [
      {
        id: 'reading-1',
        bookId: row.id,
        pages: 20,
        appliedPages: 20,
        readAt: time,
        createdAt: time,
        updatedAt: time,
      },
    ];

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      {
        booksRepository: books,
        readingRepository: createInMemoryReadingSessionsRepository(
          books,
          sessions,
        ),
      },
    );

    expect(screen.getByText('30/10 · 20 pág.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Desfazer'));

    const dialog = screen.getByTestId('confirm-dialog');
    expect(screen.getByText('Desfazer registro?')).toBeOnTheScreen();

    await fireEvent.press(within(dialog).getByText('Desfazer'));

    expect(screen.getByText('128 páginas lidas')).toBeOnTheScreen();
    expect(screen.queryByText('30/10 · 20 pág.')).not.toBeOnTheScreen();
    expect(books.findById(row.id)?.pagesRead).toBe(128);
  });

  it('não chama de concluído um livro em leitura no fim do progresso', async () => {
    const row = bookRow({ status: 'reading', pagesRead: 310 });

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: createInMemoryBooksRepository([row]) },
    );

    expect(screen.queryByText('Livro concluído.')).not.toBeOnTheScreen();
    expect(
      screen.getByText(
        'No fim do livro. Reduza as páginas lidas ou desfaça uma sessão para continuar.',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Registrar leitura')).not.toBeOnTheScreen();
  });

  it('mostra a resenha do livro concluído e abre a edição', async () => {
    const row = bookRow({ status: 'finished', pagesRead: 310 });
    const books = createInMemoryBooksRepository([row]);
    const reviews = createInMemoryReviewsRepository(books);
    const onOpenReview = jest.fn();
    reviews.save({
      bookId: row.id,
      rating: 4,
      text: 'Começa devagar e termina bem.',
      quote: 'Em um buraco no chão vivia um hobbit.',
    });

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onOpenReview={onOpenReview}
      />,
      { booksRepository: books, reviewsRepository: reviews },
    );

    expect(screen.getByTestId('resenha-card')).toBeOnTheScreen();
    expect(screen.getByText('Começa devagar e termina bem.')).toBeOnTheScreen();
    expect(
      screen.getByText('Em um buraco no chão vivia um hobbit.'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Nota: 4 de 5 estrelas')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Editar resenha'));

    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });

  it('esconde a resenha enquanto o livro não está concluído', async () => {
    const row = bookRow();
    const books = createInMemoryBooksRepository([row]);
    const reviews = createInMemoryReviewsRepository(books);
    reviews.save({ bookId: row.id, rating: 5, text: 'Guardada.' });

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: books, reviewsRepository: reviews },
    );

    expect(screen.queryByTestId('resenha-card')).not.toBeOnTheScreen();
    expect(screen.queryByText('Guardada.')).not.toBeOnTheScreen();
    expect(screen.queryByText('Escrever resenha')).not.toBeOnTheScreen();
  });

  it('oferece escrever resenha em livro concluído sem resenha', async () => {
    const row = bookRow({ status: 'finished', pagesRead: 310 });
    const onOpenReview = jest.fn();

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onOpenReview={onOpenReview}
      />,
      { booksRepository: createInMemoryBooksRepository([row]) },
    );

    expect(screen.getByTestId('resenha-vazia')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Escrever resenha'));

    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });

  it('concluir pela leitura abre a resenha', async () => {
    const row = bookRow({ pagesRead: 300 });
    const onOpenReview = jest.fn();

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
        onOpenReview={onOpenReview}
      />,
      { booksRepository: createInMemoryBooksRepository([row]) },
    );

    await fireEvent.press(screen.getByText('Registrar leitura'));
    await fireEvent.changeText(screen.getByLabelText('Páginas lidas'), '25');
    await fireEvent.press(screen.getByText('Salvar'));

    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });

  it('excluir o livro apaga a resenha', async () => {
    const row = bookRow({ status: 'finished', pagesRead: 310 });
    const books = createInMemoryBooksRepository([row]);
    const reviews = createInMemoryReviewsRepository(books);
    reviews.save({ bookId: row.id, rating: 5, text: 'Fica.' });

    await renderWithProviders(
      <BookDetailScreen
        bookId={row.id}
        onBack={jest.fn()}
        onEdit={jest.fn()}
      />,
      { booksRepository: books, reviewsRepository: reviews },
    );

    await fireEvent.press(screen.getByText('Excluir livro'));
    await fireEvent.press(screen.getByText('Excluir'));

    expect(books.list()).toHaveLength(0);
    expect(reviews.findByBook(row.id)).toBeUndefined();
  });
});
