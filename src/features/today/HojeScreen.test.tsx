import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { HojeScreen } from './HojeScreen';

describe('HojeScreen', () => {
  it('mostra a meta do dia e os blocos de leitura', async () => {
    await renderWithProviders(<HojeScreen />);

    expect(screen.getByText('Hoje')).toBeOnTheScreen();
    expect(screen.getByText('18 páginas')).toBeOnTheScreen();
    expect(
      screen.getByText('Hoje são 18 páginas. Dá tempo.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Manhã')).toBeOnTheScreen();
    expect(screen.getByText('Começar sessão')).toBeOnTheScreen();
  });
});
