import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { FilaScreen } from './FilaScreen';

describe('FilaScreen', () => {
  it('mostra a próxima leitura e o restante da fila', async () => {
    await renderWithProviders(<FilaScreen />);

    expect(screen.getByText('Fila')).toBeOnTheScreen();
    expect(screen.getByText('Próxima parada')).toBeOnTheScreen();
    expect(screen.getAllByText('Orgulho e Preconceito').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('Coraline').length).toBeGreaterThan(0);
  });
});
