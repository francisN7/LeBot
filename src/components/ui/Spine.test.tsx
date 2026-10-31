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

  it('desenha a arte 3D quando recebe o status', async () => {
    await renderWithProviders(
      <Spine
        color={colors.teal}
        status="reading"
        testID="lombada"
        title="Sapiens"
      />,
    );

    expect(screen.getByTestId('lombada-art')).toBeOnTheScreen();
  });

  it('fica na lombada 2D sem status', async () => {
    await renderWithProviders(
      <Spine color={colors.teal} testID="lombada" title="Sapiens" />,
    );

    expect(screen.queryByTestId('lombada-art')).not.toBeOnTheScreen();
  });

  it('esconde a etiqueta quando showLabel é falso', async () => {
    await renderWithProviders(
      <Spine
        color={colors.teal}
        showLabel={false}
        status="finished"
        title="Sapiens"
      />,
    );

    expect(screen.queryByText('Sapiens')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Lombada de Sapiens')).toBeOnTheScreen();
  });
});
