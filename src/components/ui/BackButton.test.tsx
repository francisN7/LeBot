import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { BackButton } from './BackButton';

describe('BackButton', () => {
  it('mostra o rótulo e dispara onPress', async () => {
    const onPress = jest.fn();

    await renderWithProviders(<BackButton onPress={onPress} />);

    expect(screen.getByText('Voltar')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Voltar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('aceita outro rótulo', async () => {
    await renderWithProviders(
      <BackButton label="Cancelar" onPress={jest.fn()} />,
    );

    expect(screen.getByText('Cancelar')).toBeOnTheScreen();
  });
});
