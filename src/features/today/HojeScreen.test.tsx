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

function todayAt(hours: number, minutes: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  );
}

function seededRepositories() {
  const books = createInMemoryBooksRepository();
  const reading = createInMemoryReadingSessionsRepository(books);
  return { books, reading };
}

describe('HojeScreen', () => {
  it('mostra a meta e os blocos do plano real, com o bloco paralelo da Ordem', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 1, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByText('Hoje')).toBeOnTheScreen();
    expect(
      screen.getByText(`Seu plano de hoje · ${formatTodayLabel(new Date())}`),
    ).toBeOnTheScreen();
    expect(screen.getByText('18 páginas')).toBeOnTheScreen();
    expect(screen.getByText('1 de 18 páginas hoje')).toBeOnTheScreen();
    expect(screen.getByText('Plano do dia')).toBeOnTheScreen();
    expect(screen.getAllByText('O Hobbit').length).toBeGreaterThan(0);
    expect(screen.getByText('Orgulho e Preconceito')).toBeOnTheScreen();
    expect(screen.getByText('Fantasia · 11 páginas')).toBeOnTheScreen();
    expect(screen.getByText('Clássico · 7 páginas')).toBeOnTheScreen();
    expect(screen.queryByText('sugestão')).not.toBeOnTheScreen();
    expect(screen.getByText('Agora')).toBeOnTheScreen();
    expect(screen.getByText('Depois')).toBeOnTheScreen();
    expect(screen.getAllByText('Registrar leitura').length).toBeGreaterThan(0);
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
  });

  it('explica o vazio e leva para a Ordem quando não há livro elegível', async () => {
    const books = createInMemoryBooksRepository([]);
    const onOpenQueue = jest.fn();

    await renderWithProviders(<HojeScreen onOpenQueue={onOpenQueue} />, {
      booksRepository: books,
      readingRepository: createInMemoryReadingSessionsRepository(books),
    });

    expect(screen.getByText('Nada para ler hoje')).toBeOnTheScreen();
    expect(screen.queryByText('Plano do dia')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Ver a ordem'));

    expect(onOpenQueue).toHaveBeenCalledTimes(1);
  });

  it('registra a partir do botão do bloco e atualiza o progresso na hora', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 1, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    await fireEvent.press(screen.getByTestId('register-book-hobbit'));

    expect(screen.getByDisplayValue('11')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(books.findById('book-hobbit')?.pagesRead).toBe(140);
    expect(screen.getByText('12 de 18 páginas hoje')).toBeOnTheScreen();
    expect(screen.getAllByText('Feito').length).toBeGreaterThan(0);
  });

  it('mostra "Registrar mais" no bloco já feito', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 11, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByTestId('register-book-hobbit')).toHaveTextContent(
      'Registrar mais',
    );
  });

  it('retoma Coraline pausada ao registrar e ela vira o livro ativo', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-coraline', pages: 10, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(books.findById('book-coraline')?.status).toBe('reading');
    expect(screen.getAllByText('Coraline').length).toBeGreaterThan(0);
    expect(screen.getByText('Terror · 11 páginas')).toBeOnTheScreen();
    expect(screen.getByText('10 de 18 páginas hoje')).toBeOnTheScreen();
    expect(screen.getByText('Agora')).toBeOnTheScreen();
  });

  it('mostra a meta batida sem fração acima de 100%', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 23, readAt: new Date() });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByText('Meta batida · 23 páginas hoje')).toBeOnTheScreen();
    expect(screen.queryByText('23 de 18 páginas hoje')).not.toBeOnTheScreen();
  });

  it('lista em "Lido hoje" as sessões de hoje com páginas e hora', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 5, readAt: todayAt(8, 30) });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByText('Lido hoje')).toBeOnTheScreen();
    expect(screen.getByText('5 páginas')).toBeOnTheScreen();
    expect(screen.getByText('08:30')).toBeOnTheScreen();
    expect(
      screen.queryByText('Nada registrado hoje ainda.'),
    ).not.toBeOnTheScreen();
  });

  it('mantém "Lido hoje" vazio quando nada foi registrado hoje', async () => {
    const { books, reading } = seededRepositories();
    reading.create({ bookId: 'book-hobbit', pages: 5, readAt: daysAgo(2) });

    await renderWithProviders(<HojeScreen />, {
      booksRepository: books,
      readingRepository: reading,
    });

    expect(screen.getByText('Nada registrado hoje ainda.')).toBeOnTheScreen();
    expect(screen.queryByText('5 páginas')).not.toBeOnTheScreen();
  });
});
