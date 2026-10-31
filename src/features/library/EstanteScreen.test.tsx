import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { EstanteScreen } from './EstanteScreen';

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
});
