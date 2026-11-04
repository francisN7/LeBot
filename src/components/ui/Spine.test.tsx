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
    expect(
      screen.getByTestId('lombada-label', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it.each([
    ['reading', 'happy'],
    ['queued', 'neutral'],
    ['paused', 'sleepy'],
    ['finished', 'shine'],
  ] as const)('status %s desenha o rosto %s', async (status, expression) => {
    await renderWithProviders(
      <Spine
        color={colors.teal}
        status={status}
        testID="lombada"
        title="Sapiens"
      />,
    );

    expect(
      screen.getByTestId(`lombada-face-${expression}`, {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
  });

  it('mostra o tassel no topo da lombada', async () => {
    await renderWithProviders(
      <Spine
        color={colors.teal}
        status="finished"
        testID="lombada"
        title="Sapiens"
      />,
    );

    expect(
      screen.getByTestId('lombada-tassel', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it('mostra o zzz flutuante no status pausado', async () => {
    await renderWithProviders(
      <Spine
        color={colors.teal}
        status="paused"
        testID="lombada"
        title="Sapiens"
      />,
    );

    expect(
      screen.getByTestId('lombada-zzz', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });

  it('fica na lombada 2D sem status', async () => {
    await renderWithProviders(
      <Spine color={colors.teal} testID="lombada" title="Sapiens" />,
    );

    expect(screen.queryByTestId('lombada-art')).not.toBeOnTheScreen();
    expect(
      screen.queryByTestId('lombada-tassel', { includeHiddenElements: true }),
    ).not.toBeOnTheScreen();
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

  it('mantém a arte montada quando a animação está pausada', async () => {
    await renderWithProviders(
      <Spine
        animating={false}
        color={colors.teal}
        status="finished"
        testID="lombada"
        title="Sapiens"
      />,
    );

    // Parar os loops não pode desmontar corpo, rosto nem tassel (S12b).
    expect(screen.getByTestId('lombada-art')).toBeOnTheScreen();
    expect(
      screen.getByTestId('lombada-tassel', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });
});
