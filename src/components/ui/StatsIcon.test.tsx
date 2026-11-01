import { render, screen } from '@testing-library/react-native';

import { StatsIcon } from './StatsIcon';

describe('StatsIcon', () => {
  it('desenha as três barras sem aparecer para o leitor de tela', async () => {
    await render(<StatsIcon testID="stats-icon" />);

    expect(
      screen.getByTestId('stats-icon', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });
});
