import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('não renderiza nada quando fechado', async () => {
    await renderWithProviders(
      <ConfirmDialog
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        title="Excluir livro?"
        visible={false}
      />,
    );

    expect(screen.queryByText('Excluir livro?')).not.toBeOnTheScreen();
  });

  it('mostra mensagem e dispara as ações', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    await renderWithProviders(
      <ConfirmDialog
        confirmLabel="Excluir"
        message="O livro sai da estante."
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Excluir livro?"
        visible
      />,
    );

    expect(screen.getByText('Excluir livro?')).toBeOnTheScreen();
    expect(screen.getByText('O livro sai da estante.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText('Excluir'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
