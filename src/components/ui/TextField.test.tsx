import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { TextField } from './TextField';

describe('TextField', () => {
  it('mostra rótulo e recebe texto', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(
      <TextField label="Título" onChangeText={onChangeText} />,
    );

    expect(screen.getByText('Título')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Título'), 'O Hobbit');

    expect(onChangeText).toHaveBeenCalledWith('O Hobbit');
  });

  it('troca a dica pelo erro quando há erro', async () => {
    await renderWithProviders(
      <TextField label="ISBN" hint="Opcional" error="ISBN inválido" />,
    );

    expect(screen.getByText('ISBN inválido')).toBeOnTheScreen();
    expect(screen.queryByText('Opcional')).not.toBeOnTheScreen();
  });
});
