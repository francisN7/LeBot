import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { GenresScreen } from './GenresScreen';

function renderScreen() {
  const onBack = jest.fn();
  const onCreate = jest.fn();
  const onOpenGenre = jest.fn();

  return {
    onBack,
    onCreate,
    onOpenGenre,
    render: renderWithProviders(
      <GenresScreen
        onBack={onBack}
        onCreate={onCreate}
        onOpenGenre={onOpenGenre}
      />,
    ),
  };
}

describe('GenresScreen', () => {
  it('lista os gêneros com a contagem de livros', async () => {
    await renderScreen().render;

    expect(screen.getByText('Fantasia')).toBeOnTheScreen();
    expect(screen.getByText('Romance')).toBeOnTheScreen();
    expect(screen.getByText('Nenhum livro ainda')).toBeOnTheScreen();
    expect(screen.getAllByText('1 livro')).toHaveLength(5);
  });

  it('abre o cadastro pelo botão Novo gênero', async () => {
    const list = renderScreen();
    await list.render;

    await fireEvent.press(screen.getByText('Novo gênero'));

    expect(list.onCreate).toHaveBeenCalledTimes(1);
  });

  it('abre a edição ao tocar no gênero', async () => {
    const list = renderScreen();
    await list.render;

    await fireEvent.press(screen.getByLabelText('Editar gênero Terror'));

    expect(list.onOpenGenre).toHaveBeenCalledWith('horror');
  });
});
