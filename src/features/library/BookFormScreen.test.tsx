import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { BookRow } from '@/db/schema';
import { createFakeCoverService } from '@/test-utils/covers';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryGenresRepository,
  testGenreRows,
} from '@/test-utils/repositories';

import { BookFormScreen } from './BookFormScreen';

function bookRow(overrides: Partial<BookRow> = {}): BookRow {
  const time = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'book-teste',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 12,
    isbn: null,
    coverUri: null,
    createdAt: time,
    updatedAt: time,
    ...overrides,
  };
}

type FormOptions = {
  bookId?: string;
  genresRepository?: ReturnType<typeof createInMemoryGenresRepository>;
};

function renderForm(
  repository: ReturnType<typeof createInMemoryBooksRepository>,
  options: FormOptions = {},
) {
  const onDone = jest.fn();
  const onCancel = jest.fn();
  const coverService = createFakeCoverService();

  return {
    onDone,
    onCancel,
    coverService,
    render: renderWithProviders(
      <BookFormScreen
        bookId={options.bookId}
        onCancel={onCancel}
        onDone={onDone}
      />,
      {
        booksRepository: repository,
        genresRepository: options.genresRepository,
        coverService,
      },
    ),
  };
}

describe('BookFormScreen', () => {
  it('cadastra um livro e fecha a tela', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Título'), 'O Hobbit');
    await fireEvent.changeText(
      screen.getByLabelText('Autor'),
      'J. R. R. Tolkien',
    );
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '310');
    await fireEvent.press(screen.getByText('Salvar livro'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    const rows = repository.list();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe('O Hobbit');
    expect(rows[0]?.pages).toBe(310);
    expect(rows[0]?.coverUri).toBeNull();
  });

  it('bloqueia o salvar com ISBN inválido', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Título'), 'O Hobbit');
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'Tolkien');
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '310');
    await fireEvent.changeText(screen.getByLabelText('ISBN'), '9780306406158');
    await fireEvent.press(screen.getByText('Salvar livro'));

    expect(screen.getByText('ISBN inválido')).toBeOnTheScreen();
    expect(form.onDone).not.toHaveBeenCalled();
    expect(repository.list()).toHaveLength(0);
  });

  it('pede título e páginas válidas', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.press(screen.getByText('Salvar livro'));

    expect(screen.getByText('Informe o título')).toBeOnTheScreen();
    expect(screen.getByText('Informe o autor')).toBeOnTheScreen();
    expect(screen.getByText('Informe o total de páginas')).toBeOnTheScreen();
    expect(repository.list()).toHaveLength(0);
  });

  it('cadastra um livro já em andamento com páginas lidas', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Título'), 'Warbreaker');
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'Sanderson');
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '900');
    await fireEvent.changeText(screen.getByLabelText('Páginas lidas'), '120');
    await fireEvent.press(screen.getByText('Salvar livro'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    expect(repository.list()[0]?.pagesRead).toBe(120);
  });

  it('bloqueia páginas lidas acima do total', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Título'), 'Warbreaker');
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'Sanderson');
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '300');
    await fireEvent.changeText(screen.getByLabelText('Páginas lidas'), '301');
    await fireEvent.press(screen.getByText('Salvar livro'));

    expect(
      screen.getByText('As páginas lidas não podem passar do total'),
    ).toBeOnTheScreen();
    expect(repository.list()).toHaveLength(0);
  });

  it('edita um livro existente e mantém o id', async () => {
    const row = bookRow({ isbn: '9780306406157' });
    const repository = createInMemoryBooksRepository([row]);
    const form = renderForm(repository, { bookId: row.id });
    await form.render;

    expect(screen.getByDisplayValue('O Hobbit')).toBeOnTheScreen();
    expect(screen.getByDisplayValue('9780306406157')).toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('Título'),
      'O Hobbit, revisado',
    );
    await fireEvent.press(screen.getByText('Salvar livro'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    const saved = repository.findById(row.id);
    expect(repository.list()).toHaveLength(1);
    expect(saved?.title).toBe('O Hobbit, revisado');
    expect(saved?.isbn).toBe('9780306406157');
  });

  it('salva a capa escolhida no aparelho', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Título'), 'O Hobbit');
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'Tolkien');
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '310');
    await fireEvent.press(screen.getByText('Escolher capa'));

    expect(screen.getByLabelText('Capa escolhida')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar livro'));
    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    expect(form.coverService.saved).toEqual([
      {
        bookId: expect.stringMatching(/^book-/),
        sourceUri: 'file:///tmp/capa-escolhida.jpg',
      },
    ]);
    expect(repository.list()[0]?.coverUri).toMatch(
      /^file:\/\/\/covers\/book-.+\.jpg$/,
    );
  });

  it('remove a capa antiga ao salvar sem capa', async () => {
    const row = bookRow({ coverUri: 'file:///covers/book-teste.jpg' });
    const repository = createInMemoryBooksRepository([row]);
    const form = renderForm(repository, { bookId: row.id });
    await form.render;

    await fireEvent.press(screen.getByText('Remover capa'));
    await fireEvent.press(screen.getByText('Salvar livro'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    expect(repository.findById(row.id)?.coverUri).toBeNull();
    expect(form.coverService.removed).toEqual([
      'file:///covers/book-teste.jpg',
    ]);
  });

  it('mostra o erro quando o ISBN já está cadastrado', async () => {
    const repository = createInMemoryBooksRepository([
      bookRow({ id: 'book-existente', isbn: '9780306406157' }),
    ]);
    const form = renderForm(repository);
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Título'), 'Outro livro');
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'Tolkien');
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '200');
    await fireEvent.changeText(screen.getByLabelText('ISBN'), '9780306406157');
    await fireEvent.press(screen.getByText('Salvar livro'));

    await waitFor(() =>
      expect(
        screen.getByText('Já existe um livro com este ISBN'),
      ).toBeOnTheScreen(),
    );
    expect(form.onDone).not.toHaveBeenCalled();
    expect(repository.list()).toHaveLength(1);
  });

  it('lista os gêneros do banco e salva o escolhido', async () => {
    const repository = createInMemoryBooksRepository([]);
    const genresRepository = createInMemoryGenresRepository(
      testGenreRows.map((genre) =>
        genre.id === 'horror' ? { ...genre, name: 'Assombro' } : genre,
      ),
    );
    const form = renderForm(repository, { genresRepository });
    await form.render;

    expect(screen.getByText('Assombro')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Título'), 'Coraline');
    await fireEvent.changeText(screen.getByLabelText('Autor'), 'Gaiman');
    await fireEvent.changeText(screen.getByLabelText('Páginas'), '208');
    await fireEvent.press(screen.getByText('Assombro'));
    await fireEvent.press(screen.getByText('Salvar livro'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));
    expect(repository.list()[0]?.genreId).toBe('horror');
  });

  it('mostra ISBN válido enquanto digita e normaliza ao sair do campo', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository);
    await form.render;

    const isbn = screen.getByLabelText('ISBN');

    await fireEvent.changeText(isbn, '978-0-306-40615-7');
    expect(screen.getByText('ISBN válido')).toBeOnTheScreen();

    await fireEvent(isbn, 'blur');
    expect(screen.getByDisplayValue('9780306406157')).toBeOnTheScreen();
  });

  it('avisa que o livro não existe', async () => {
    const repository = createInMemoryBooksRepository([]);
    const form = renderForm(repository, { bookId: 'book-sumiu' });
    await form.render;

    expect(screen.getByText('Livro não encontrado')).toBeOnTheScreen();
    expect(form.onDone).not.toHaveBeenCalled();
  });
});
