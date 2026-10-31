import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { Mascot, mascotLabel } from './Mascot';

describe('Mascot', () => {
  it('anuncia o estado neutro por padrão', async () => {
    await renderWithProviders(<Mascot />);

    expect(screen.getByLabelText('LêBot, o robô leitor')).toBeOnTheScreen();
  });

  it.each([
    ['reading', 'LêBot lendo um livro'],
    ['happy', 'LêBot feliz'],
    ['sleepy', 'LêBot sonolento'],
    ['thinking', 'LêBot pensando'],
    ['celebrating', 'LêBot comemorando'],
  ] as const)('descreve o estado %s', async (state, label) => {
    await renderWithProviders(<Mascot state={state} />);

    expect(screen.getByLabelText(label)).toBeOnTheScreen();
    expect(label).toBe(mascotLabel[state]);
  });

  it('aceita rótulo próprio', async () => {
    await renderWithProviders(
      <Mascot accessibilityLabel="LêBot no estado vazio" state="thinking" />,
    );

    expect(screen.getByLabelText('LêBot no estado vazio')).toBeOnTheScreen();
  });

  it('desenha o mascote no tamanho pedido', async () => {
    await renderWithProviders(<Mascot size={64} testID="mascote" />);

    expect(screen.getByTestId('mascote')).toBeOnTheScreen();
  });
});
