import { fireEvent, screen } from '@testing-library/react-native';
import { seedSettings } from '@/db/seed';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReadingSessionsRepository,
  createInMemorySettingsRepository,
} from '@/test-utils/repositories';

import { formatTodayLabel } from './format';
import { HojeScreen } from './HojeScreen';

function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, 12);
}

function seededRepositories() {
  const books = createInMemoryBooksRepository();
  const reading = createInMemoryReadingSessionsRepository(books);
  return { books, reading };
}

describe('HojeScreen', () => {
  it('mostra a meta e os blocos do plano real, com a sugestão marcada', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 1, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByText('Hoje')).toBeOnTheScreen();
    expect(screen.getByText(formatTodayLabel(new Date()))).toBeOnTheScreen();
    expect(screen.getByText('18 páginas')).toBeOnTheScreen();
    expect(screen.getByText('1 de 18 páginas hoje')).toBeOnTheScreen();
    expect(screen.getByText('O Hobbit')).toBeOnTheScreen();
    expect(screen.getByText('Orgulho e Preconceito')).toBeOnTheScreen();
    expect(screen.getByText('Fantasia · 11 páginas')).toBeOnTheScreen();
    expect(screen.getByText('Clássico · 7 páginas')).toBeOnTheScreen();
    expect(screen.getByText('sugestão')).toBeOnTheScreen();
    expect(screen.getByText('Agora')).toBeOnTheScreen();
    expect(screen.getByText('Depois')).toBeOnTheScreen();
  });

  it('avisa a volta leve mesmo com a última sessão fora da janela de 7 dias', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 5, readAt: daysAgo(10) });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByText('12 páginas')).toBeOnTheScreen();
    expect(
      screen.getByText('Volta leve: hoje vale 70% da meta de 18.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('0 de 12 páginas hoje')).toBeOnTheScreen();
  });

  it('avisa quando a meta é pequena demais para dividir o dia', async () => {
    const { books, reading } = seededRepositories();

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
      settingsRepository: createInMemorySettingsRepository({
        ...seedSettings,
        'goal.pages': '8',
      }),
    });

    expect(screen.getByText('8 páginas')).toBeOnTheScreen();
    expect(
      screen.getByText('Com 8 páginas, o dia costuma render um livro só.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('sugestão')).not.toBeOnTheScreen();
  });

  it('explica o vazio e leva para a Fila quando não há livro elegível', async () => {
    const books = createInMemoryBooksRepository([]);
    const onOpenQueue = jest.fn();

    await renderWithProviders(<HojeScreen onOpenQueue={onOpenQueue} />, {
      booksRepository: books,
      readingRepository: createInMemoryReadingSessionsRepository(books),
    });

    expect(screen.getByText('Nada para ler hoje')).toBeOnTheScreen();
    expect(screen.queryByText('Blocos de leitura')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Ver a fila'));

    expect(onOpenQueue).toHaveBeenCalledTimes(1);
  });

  it('registra a partir do bloco e atualiza o progresso na hora', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 1, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    await fireEvent.press(
      screen.getByLabelText('Registrar leitura de O Hobbit'),
    );

    expect(screen.getByDisplayValue('11')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(books.findById('book-hobbit')?.pagesRead).toBe(140);
    expect(screen.getByText('12 de 18 páginas hoje')).toBeOnTheScreen();
    expect(screen.getAllByText('Feito').length).toBeGreaterThan(0);
  });
});
