import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryGenresRepository,
  testGenreRows,
} from '@/test-utils/repositories';

import { GenreFormScreen } from './GenreFormScreen';

function renderForm(genreId?: string) {
  const books = createInMemoryBooksRepository();
  const repository = createInMemoryGenresRepository(
    testGenreRows,
    (id) => books.list().filter((book) => book.genreId === id).length,
  );
  const onDone = jest.fn();
  const onCancel = jest.fn();

  return {
    repository,
    onDone,
    onCancel,
    render: renderWithProviders(
      <GenreFormScreen genreId={genreId} onCancel={onCancel} onDone={onDone} />,
      { booksRepository: books, genresRepository: repository },
    ),
  };
}

describe('GenreFormScreen', () => {
  it('cadastra um gênero com preset de cor', async () => {
    const form = renderForm();
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Nome'), 'Poesia');
    await fireEvent.press(screen.getByLabelText('Paleta gold'));
    await fireEvent.press(screen.getByText('Salvar gênero'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    const saved = form.repository.list().at(-1);
    expect(saved?.name).toBe('Poesia');
    expect(saved?.colorLight).toBe('#FFC145');
    expect(saved?.colorDark).toBe('#FFD980');
    expect(saved?.paletteIndex).toBe(4);
  });

  it('cadastra com cor personalizada', async () => {
    const form = renderForm();
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Nome'), 'Poesia');
    await fireEvent.press(screen.getByText('Cor personalizada'));
    await fireEvent.changeText(screen.getByLabelText('Cor clara'), '#123abc');
    await fireEvent.changeText(screen.getByLabelText('Cor escura'), '#abcdef');
    await fireEvent.press(screen.getByText('Salvar gênero'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));

    const saved = form.repository.list().at(-1);
    expect(saved?.colorLight).toBe('#123ABC');
    expect(saved?.colorDark).toBe('#ABCDEF');
    expect(saved?.paletteIndex).toBeNull();
  });

  it('bloqueia hex inválido antes de salvar', async () => {
    const form = renderForm();
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Nome'), 'Poesia');
    await fireEvent.press(screen.getByText('Cor personalizada'));
    await fireEvent.changeText(screen.getByLabelText('Cor clara'), 'roxo');
    await fireEvent.press(screen.getByText('Salvar gênero'));

    expect(screen.getByText('Use um hex como #7B69EE')).toBeOnTheScreen();
    expect(form.onDone).not.toHaveBeenCalled();
    expect(form.repository.list()).toHaveLength(testGenreRows.length);
  });

  it('recusa nome repetido', async () => {
    const form = renderForm();
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Nome'), 'terror');
    await fireEvent.press(screen.getByText('Salvar gênero'));

    expect(
      screen.getByText('Já existe um gênero com este nome'),
    ).toBeOnTheScreen();
    expect(form.repository.list()).toHaveLength(testGenreRows.length);
  });

  it('renomeia um gênero existente e mantém o id', async () => {
    const form = renderForm('romance');
    await form.render;

    await fireEvent.changeText(screen.getByLabelText('Nome'), 'Drama');
    await fireEvent.press(screen.getByText('Salvar gênero'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));
    expect(form.repository.findById('romance')?.name).toBe('Drama');
  });

  it('exclui um gênero sem livros', async () => {
    const form = renderForm('romance');
    await form.render;

    await fireEvent.press(screen.getByText('Excluir gênero'));
    await fireEvent.press(screen.getByText('Excluir'));

    await waitFor(() => expect(form.onDone).toHaveBeenCalledTimes(1));
    expect(form.repository.findById('romance')).toBeUndefined();
  });

  it('bloqueia a exclusão de gênero em uso', async () => {
    const form = renderForm('fantasy');
    await form.render;

    await fireEvent.press(screen.getByText('Excluir gênero'));
    await fireEvent.press(screen.getByText('Excluir'));

    expect(
      screen.getByText(
        'Este gênero está em 1 livro. Troque o gênero dele antes de excluir.',
      ),
    ).toBeOnTheScreen();
    expect(form.onDone).not.toHaveBeenCalled();
    expect(form.repository.findById('fantasy')).toBeDefined();
  });

  it('avisa que o gênero não existe', async () => {
    const form = renderForm('genre-sumiu');
    await form.render;

    expect(screen.getByText('Gênero não encontrado')).toBeOnTheScreen();
  });
});
