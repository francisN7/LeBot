import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';
import { colors } from '@/theme';

import { Spine } from './Spine';

describe('Spine', () => {
  it('expõe a lombada pelo nome do livro', async () => {
    await renderWithProviders(<Spine color={colors.purple} title="O Hobbit" />);

    expect(screen.getByLabelText('Lombada de O Hobbit')).toBeOnTheScreen();
    expect(screen.getByText('O Hobbit')).toBeOnTheScreen();
  });

  it('vira botão quando recebe onPress', async () => {
    const onPress = jest.fn();

    await renderWithProviders(
      <Spine color={colors.coral} onPress={onPress} title="Coraline" />,
    );
    await fireEvent.press(screen.getByLabelText('Lombada de Coraline'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
