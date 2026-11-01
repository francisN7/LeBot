import { fireEvent, screen } from '@testing-library/react-native';

import type { BookRow, ReadingSessionRow, ReviewRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReadingSessionsRepository,
  createInMemoryReviewsRepository,
} from '@/test-utils/repositories';

import { StatsScreen } from './StatsScreen';

const today = new Date(2026, 10, 20, 12); // sexta, 20 de novembro de 2026
const stamp = new Date(2026, 9, 1);
const reviewer = new Date(2026, 9, 20);

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  return {
    id: 'book-hobbit',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 35,
    isbn: null,
    coverUri: null,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}

function sessionRow(
  overrides: Partial<ReadingSessionRow> & { id: string },
): ReadingSessionRow {
  return {
    bookId: 'book-hobbit',
    pages: 10,
    appliedPages: null,
    readAt: today,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}

function reviewRow(overrides: Partial<ReviewRow> = {}): ReviewRow {
  return {
    bookId: 'book-finished',
    rating: 5,
    text: null,
    quote: null,
    extras: {},
    createdAt: reviewer,
    updatedAt: reviewer,
    ...overrides,
  };
}

function setup() {
  const books = [
    bookRow(),
    bookRow({
      id: 'book-finished',
      title: 'O Pequeno Príncipe',
      status: 'finished',
      updatedAt: new Date(2026, 10, 10),
    }),
  ];
  const booksRepository = createInMemoryBooksRepository(books);
  const readingRepository = createInMemoryReadingSessionsRepository(
    booksRepository,
    [
      sessionRow({ id: 's-1', pages: 20, readAt: new Date(2026, 10, 18) }),
      sessionRow({ id: 's-2', pages: 10, readAt: new Date(2026, 10, 19) }),
      sessionRow({ id: 's-3', pages: 5, readAt: new Date(2026, 10, 20) }),
      sessionRow({ id: 's-4', pages: 100, readAt: new Date(2026, 8, 20) }),
    ],
  );
  const reviewsRepository = createInMemoryReviewsRepository(booksRepository, [
    reviewRow(),
  ]);

  return { booksRepository, readingRepository, reviewsRepository };
}

describe('StatsScreen', () => {
  it('mostra números reais do período e a frase do LêBot', async () => {
    const { booksRepository, readingRepository, reviewsRepository } = setup();

    await renderWithProviders(
      <StatsScreen onBack={jest.fn()} today={today} />,
      { booksRepository, readingRepository, reviewsRepository },
    );

    expect(screen.getByText('Meu ritmo')).toBeOnTheScreen();
    expect(screen.getByLabelText('35 páginas')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 dias ativos')).toBeOnTheScreen();
    expect(screen.getByLabelText('3 dias seguidos')).toBeOnTheScreen();
    expect(
      screen.getByText('Sequência de 3 dias. O LêBot está orgulhoso.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Fantasia')).toBeOnTheScreen();
    expect(screen.getByText('Concluídos')).toBeOnTheScreen();
    expect(screen.getByText('5,0')).toBeOnTheScreen();
  });

  it('recalcula ao trocar o período', async () => {
    const { booksRepository, readingRepository, reviewsRepository } = setup();

    await renderWithProviders(
      <StatsScreen onBack={jest.fn()} today={today} />,
      { booksRepository, readingRepository, reviewsRepository },
    );

    await fireEvent.press(screen.getByText('3 meses'));

    expect(screen.getByLabelText('135 páginas')).toBeOnTheScreen();
  });

  it('abre os livros de uma nota e volta para o resumo', async () => {
    const { booksRepository, readingRepository, reviewsRepository } = setup();

    await renderWithProviders(
      <StatsScreen onBack={jest.fn()} today={today} />,
      { booksRepository, readingRepository, reviewsRepository },
    );

    await fireEvent.press(screen.getByLabelText('Ver livros com nota 5'));

    expect(screen.getByText('5 estrelas')).toBeOnTheScreen();
    expect(screen.getByText('O Pequeno Príncipe')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Voltar às notas'));

    expect(screen.getByText('Suas notas')).toBeOnTheScreen();
  });

  it('mostra o estado vazio sem gráfico zerado', async () => {
    const booksRepository = createInMemoryBooksRepository([
      bookRow({ pagesRead: 0 }),
    ]);
    const readingRepository =
      createInMemoryReadingSessionsRepository(booksRepository);

    await renderWithProviders(
      <StatsScreen onBack={jest.fn()} today={today} />,
      { booksRepository, readingRepository },
    );

    expect(
      screen.getByText('Ainda não tem páginas neste período'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Ritmo')).not.toBeOnTheScreen();
  });

  it('abre o livro concluído pela mini-lombada', async () => {
    const onOpenBook = jest.fn();
    const { booksRepository, readingRepository, reviewsRepository } = setup();

    await renderWithProviders(
      <StatsScreen onBack={jest.fn()} onOpenBook={onOpenBook} today={today} />,
      { booksRepository, readingRepository, reviewsRepository },
    );

    await fireEvent.press(
      screen.getByLabelText('Lombada de O Pequeno Príncipe'),
    );

    expect(onOpenBook).toHaveBeenCalledWith('book-finished');
  });

  it('abre a linha do tempo pelo botão Ver tudo', async () => {
    const onOpenTimeline = jest.fn();
    const { booksRepository, readingRepository, reviewsRepository } = setup();

    await renderWithProviders(
      <StatsScreen
        onBack={jest.fn()}
        onOpenTimeline={onOpenTimeline}
        today={today}
      />,
      { booksRepository, readingRepository, reviewsRepository },
    );

    await fireEvent.press(screen.getByText('Ver tudo'));

    expect(onOpenTimeline).toHaveBeenCalledTimes(1);
  });

  it('volta pelo botão de voltar', async () => {
    const onBack = jest.fn();
    const { booksRepository, readingRepository, reviewsRepository } = setup();

    await renderWithProviders(<StatsScreen onBack={onBack} today={today} />, {
      booksRepository,
      readingRepository,
      reviewsRepository,
    });

    await fireEvent.press(screen.getByText('Voltar'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
