import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReadingForm } from './ReadingForm';

async function setup(
  overrides: Partial<Parameters<typeof ReadingForm>[0]> = {},
) {
  const onSave = jest.fn();
  const onCancel = jest.fn();

  await render(
    <ReadingForm
      bookTitle="O Hobbit"
      defaultPages={12}
      onCancel={onCancel}
      onSave={onSave}
      remaining={40}
      visible
      {...overrides}
    />,
  );

  return { onSave, onCancel };
}

describe('ReadingForm', () => {
  it('abre com o valor sugerido e salva as páginas', async () => {
    const { onSave } = await setup();

    expect(screen.getByDisplayValue('12')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(onSave).toHaveBeenCalledWith(12);
  });

  it('recusa zero, negativo e campo vazio', async () => {
    const { onSave } = await setup();
    const field = screen.getByLabelText('Páginas lidas');

    for (const value of ['0', '-5', '']) {
      await fireEvent.changeText(field, value);
      await fireEvent.press(screen.getByText('Salvar'));
      expect(
        screen.getByText('Informe pelo menos 1 página.'),
      ).toBeOnTheScreen();
    }

    expect(onSave).not.toHaveBeenCalled();
  });

  it('soma com os atalhos de +1 e +10', async () => {
    const { onSave } = await setup();

    await fireEvent.press(screen.getByText('+10'));
    await fireEvent.press(screen.getByText('+1'));
    await fireEvent.press(screen.getByText('Salvar'));

    expect(onSave).toHaveBeenCalledWith(23);
  });

  it('avisa quando a sessão passa do que falta, sem bloquear', async () => {
    const { onSave } = await setup();

    await fireEvent.changeText(screen.getByLabelText('Páginas lidas'), '55');

    expect(
      screen.getByText(
        'Só faltam 40 páginas: o progresso para no fim do livro.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Salvar'));

    expect(onSave).toHaveBeenCalledWith(55);
  });

  it('cancelar fecha sem salvar', async () => {
    const { onSave, onCancel } = await setup();

    await fireEvent.press(screen.getByText('Cancelar'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
