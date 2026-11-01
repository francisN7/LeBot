import {
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import type { BookRow, ReviewFieldRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryReviewFieldsRepository,
  createInMemoryReviewsRepository,
} from '@/test-utils/repositories';

import { AjustesScreen } from './AjustesScreen';

function bookRow(): BookRow {
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
  };
}

function fieldRow(id: string, name: string): ReviewFieldRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return { id, name, sortOrder: 0, createdAt: time, updatedAt: time };
}

function setup(fields: ReviewFieldRow[] = []) {
  const books = createInMemoryBooksRepository([bookRow()]);
  const reviews = createInMemoryReviewsRepository(books);
  const fieldsRepository = createInMemoryReviewFieldsRepository(
    fields,
    reviews,
  );

  return {
    books,
    reviews,
    fields: fieldsRepository,
    options: {
      booksRepository: books,
      reviewsRepository: reviews,
      reviewFieldsRepository: fieldsRepository,
    },
  };
}

describe('campos de resenha em Ajustes', () => {
  it('mostra a seção vazia e as sugestões', async () => {
    await renderWithProviders(<AjustesScreen />, setup().options);

    expect(screen.getByTestId('campos-resenha')).toBeOnTheScreen();
    expect(screen.getByText('0 campos')).toBeOnTheScreen();
    expect(screen.getByText('Sugestões')).toBeOnTheScreen();
    expect(screen.getByText('O que melhorar?')).toBeOnTheScreen();
    expect(screen.getByText('O que não gostei?')).toBeOnTheScreen();
    expect(screen.getByText('Que repertório me deu?')).toBeOnTheScreen();
    expect(screen.getByText('Para quem indico?')).toBeOnTheScreen();
  });

  it('adiciona um campo digitado e tira a sugestão correspondente', async () => {
    const { fields, options } = setup();

    await renderWithProviders(<AjustesScreen />, options);

    await fireEvent.changeText(
      screen.getByLabelText('Adicionar campo'),
      'O que aprendi?',
    );
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(screen.getByText('1 campo')).toBeOnTheScreen();
    expect(screen.getByText('O que aprendi?')).toBeOnTheScreen();
    expect(fields.list()[0]?.name).toBe('O que aprendi?');

    await fireEvent.changeText(
      screen.getByLabelText('Adicionar campo'),
      'O que melhorar?',
    );
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(screen.getByText('2 campos')).toBeOnTheScreen();
    expect(
      screen.queryByTestId('sugestao-O que melhorar?'),
    ).not.toBeOnTheScreen();
  });

  it('adiciona direto pela sugestão', async () => {
    const { fields, options } = setup();

    await renderWithProviders(<AjustesScreen />, options);

    await fireEvent.press(screen.getByText('O que não gostei?'));

    expect(fields.list().map((field) => field.name)).toEqual([
      'O que não gostei?',
    ]);
    expect(
      screen.queryByTestId('sugestao-O que não gostei?'),
    ).not.toBeOnTheScreen();
  });

  it('avisa quando o nome já existe', async () => {
    await renderWithProviders(
      <AjustesScreen />,
      setup([fieldRow('field-1', 'Repertório')]).options,
    );

    await fireEvent.changeText(
      screen.getByLabelText('Adicionar campo'),
      'repertório',
    );
    await fireEvent.press(screen.getByText('Adicionar'));

    expect(
      screen.getByText('Já existe um campo com este nome'),
    ).toBeOnTheScreen();
  });

  it('renomeia um campo existente', async () => {
    const { fields, options } = setup([fieldRow('field-1', 'Impressões')]);

    await renderWithProviders(<AjustesScreen />, options);

    await fireEvent.press(screen.getByText('Renomear'));
    await fireEvent.changeText(
      screen.getByLabelText('Nome do campo'),
      'Primeiras impressões',
    );
    await fireEvent.press(screen.getByText('Salvar nome'));

    expect(fields.list()[0]?.name).toBe('Primeiras impressões');
    expect(screen.getByText('Primeiras impressões')).toBeOnTheScreen();
  });

  it('exclui o campo e limpa o valor nas resenhas', async () => {
    const { fields, reviews, options } = setup([
      fieldRow('field-1', 'O que melhorar?'),
    ]);
    reviews.save({
      bookId: 'book-teste',
      rating: 4,
      extras: { 'field-1': 'Mais mapas.', outro: 'Fica.' },
    });

    await renderWithProviders(<AjustesScreen />, options);

    await fireEvent.press(screen.getByText('Excluir'));

    const dialog = screen.getByTestId('confirm-dialog');
    expect(screen.getByText('Excluir campo?')).toBeOnTheScreen();

    await fireEvent.press(within(dialog).getByText('Excluir'));

    await waitFor(() => expect(fields.list()).toHaveLength(0));
    expect(screen.getByText('0 campos')).toBeOnTheScreen();
    expect(reviews.findByBook('book-teste')?.extras).toEqual({
      outro: 'Fica.',
    });
  });
});
