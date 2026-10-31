import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { Button } from './Button';

describe('Button', () => {
  it('renderiza o rótulo e dispara onPress', async () => {
    const onPress = jest.fn();

    await renderWithProviders(<Button label="Começar" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Começar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não dispara onPress quando desabilitado', async () => {
    const onPress = jest.fn();

    await renderWithProviders(
      <Button disabled label="Começar" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByText('Começar'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
