import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { AjustesScreen } from './AjustesScreen';

describe('AjustesScreen', () => {
  it('mostra as preferências e a versão do app', async () => {
    await renderWithProviders(<AjustesScreen />);

    expect(screen.getByText('Ajustes')).toBeOnTheScreen();
    expect(screen.getByText('Meta diária')).toBeOnTheScreen();
    expect(screen.getByText('Lembrete')).toBeOnTheScreen();
    expect(screen.getByText('Sobre o LêBot')).toBeOnTheScreen();
  });

  it('abre a gestão de gêneros', async () => {
    const onOpenGenres = jest.fn();
    await renderWithProviders(<AjustesScreen onOpenGenres={onOpenGenres} />);

    expect(screen.getByText('6 gêneros')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Gerenciar gêneros'));

    expect(onOpenGenres).toHaveBeenCalledTimes(1);
  });
});
