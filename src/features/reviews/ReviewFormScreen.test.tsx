import { fireEvent, screen } from '@testing-library/react-native';

import type { BookRow, ReviewFieldRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReviewFieldsRepository,
  createInMemoryReviewsRepository,
} from '@/test-utils/repositories';

import { ReviewFormScreen } from './ReviewFormScreen';

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'book-teste',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'finished',
    pages: 310,
    pagesRead: 310,
    isbn: null,
    coverUri: null,
    createdAt: time,
    updatedAt: time,
    ...overrides,
  };
}

function fieldRow(id: string, name: string, sortOrder: number): ReviewFieldRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return { id, name, sortOrder, createdAt: time, updatedAt: time };
}

function setup(overrides: { fields?: ReviewFieldRow[] } = {}) {
  const row = bookRow();
  const books = createInMemoryBooksRepository([row]);
  const reviews = createInMemoryReviewsRepository(books);
  const fields = createInMemoryReviewFieldsRepository(
    overrides.fields ?? [],
    reviews,
  );
  const onDone = jest.fn();
  const onCancel = jest.fn();

  return {
    row,
    books,
    reviews,
    fields,
    onDone,
    onCancel,
    options: {
      booksRepository: books,
      reviewsRepository: reviews,
      reviewFieldsRepository: fields,
    },
  };
}

describe('ReviewFormScreen', () => {
  it('não salva sem nota e guarda nota, texto e citação', async () => {
    const { row, reviews, onDone, options } = setup();

    await renderWithProviders(
      <ReviewFormScreen bookId={row.id} onCancel={jest.fn()} onDone={onDone} />,
      options,
    );

    await fireEvent.press(screen.getByTestId('salvar-resenha'));
    expect(onDone).not.toHaveBeenCalled();
    expect(reviews.findByBook(row.id)).toBeUndefined();

    await fireEvent.press(screen.getByLabelText('4 de 5 estrelas'));
    await fireEvent.changeText(
      screen.getByLabelText('Resenha'),
      'Começa devagar e termina bem.',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Citação favorita'),
      'Em um buraco no chão vivia um hobbit.',
    );
    await fireEvent.press(screen.getByTestId('salvar-resenha'));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(reviews.findByBook(row.id)).toMatchObject({
      rating: 4,
      text: 'Começa devagar e termina bem.',
      quote: 'Em um buraco no chão vivia um hobbit.',
    });
  });

  it('abre preenchida para editar e atualiza a mesma resenha', async () => {
    const { row, reviews, onDone, options } = setup();
    reviews.save({
      bookId: row.id,
      rating: 3,
      text: 'Boa aventura.',
      extras: { field_melhoria: 'Mais mapas.' },
    });

    await renderWithProviders(
      <ReviewFormScreen bookId={row.id} onCancel={jest.fn()} onDone={onDone} />,
      {
        ...options,
        reviewFieldsRepository: createInMemoryReviewFieldsRepository(
          [fieldRow('field_melhoria', 'O que melhorar?', 0)],
          reviews,
        ),
      },
    );

    expect(screen.getByText('Editar resenha')).toBeOnTheScreen();
    expect(screen.getByLabelText('Resenha')).toHaveDisplayValue(
      'Boa aventura.',
    );

    await fireEvent.changeText(
      screen.getByLabelText('Resenha'),
      'Melhor na releitura.',
    );
    await fireEvent.press(screen.getByTestId('salvar-resenha'));

    expect(reviews.findByBook(row.id)).toMatchObject({
      rating: 3,
      text: 'Melhor na releitura.',
      extras: { field_melhoria: 'Mais mapas.' },
    });
    expect(reviews.list()).toHaveLength(1);
  });

  it('pular não salva nada', async () => {
    const { row, reviews, onCancel, options } = setup();

    await renderWithProviders(
      <ReviewFormScreen
        bookId={row.id}
        onCancel={onCancel}
        onDone={jest.fn()}
      />,
      options,
    );

    await fireEvent.press(screen.getByTestId('pular-resenha'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(reviews.findByBook(row.id)).toBeUndefined();
  });

  it('abre os campos extras por chip, em acordeão, e salva os preenchidos', async () => {
    const { row, reviews, onDone, options } = setup({
      fields: [
        fieldRow('field_melhoria', 'O que melhorar?', 0),
        fieldRow('field_repertorio', 'Que repertório me deu?', 1),
      ],
    });

    await renderWithProviders(
      <ReviewFormScreen bookId={row.id} onCancel={jest.fn()} onDone={onDone} />,
      options,
    );

    expect(screen.queryByLabelText('O que melhorar?')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('campo-field_melhoria'));
    await fireEvent.changeText(
      screen.getByLabelText('O que melhorar?'),
      'Mais mapas.',
    );

    await fireEvent.press(screen.getByTestId('campo-field_repertorio'));
    expect(screen.queryByLabelText('O que melhorar?')).not.toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByLabelText('Que repertório me deu?'),
      'Mitologia nórdica.',
    );

    await fireEvent.press(screen.getByTestId('campo-field_melhoria'));
    expect(screen.getByLabelText('O que melhorar?')).toHaveDisplayValue(
      'Mais mapas.',
    );

    await fireEvent.press(screen.getByLabelText('5 de 5 estrelas'));
    await fireEvent.press(screen.getByTestId('salvar-resenha'));

    expect(reviews.findByBook(row.id)?.extras).toEqual({
      field_melhoria: 'Mais mapas.',
      field_repertorio: 'Mitologia nórdica.',
    });
  });

  it('sem campos criados, explica onde criá-los', async () => {
    const { row, options } = setup();

    await renderWithProviders(
      <ReviewFormScreen
        bookId={row.id}
        onCancel={jest.fn()}
        onDone={jest.fn()}
      />,
      options,
    );

    expect(
      screen.getByText(
        'Nenhum campo criado. Adicione em Ajustes → Campos de resenha.',
      ),
    ).toBeOnTheScreen();
  });
});
