import { fireEvent, screen, within } from '@testing-library/react-native';

import { HojeScreen } from '@/features/today';
import { renderWithProviders } from '@/test-utils/render';

import { AjustesScreen } from './AjustesScreen';

describe('AjustesScreen', () => {
  it('mostra as seções, as preferências e a versão do app', async () => {
    await renderWithProviders(<AjustesScreen />);

    expect(screen.getByText('Ajustes')).toBeOnTheScreen();
    expect(
      screen
        .getAllByText(/^(Leitura|Organização|Dados|Sobre)$/)
        .map((node) => node.props.children),
    ).toEqual(['Leitura', 'Organização', 'Dados', 'Sobre']);
    expect(screen.getByText('Meta diária')).toBeOnTheScreen();
    expect(screen.getByText('Lembrete')).toBeOnTheScreen();
    expect(screen.getByText('Aparência')).toBeOnTheScreen();
    expect(screen.getAllByText('Em breve')).toHaveLength(2);
    expect(screen.getByText('Sobre o LêBot')).toBeOnTheScreen();
  });

  it('não exibe horário nem tema falsos', async () => {
    await renderWithProviders(<AjustesScreen />);

    expect(screen.queryByText('20:00')).not.toBeOnTheScreen();
    expect(screen.queryByText('Claro')).not.toBeOnTheScreen();
  });

  it('abre a gestão de gêneros', async () => {
    const onOpenGenres = jest.fn();
    await renderWithProviders(<AjustesScreen onOpenGenres={onOpenGenres} />);

    expect(screen.getByText('6 gêneros')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Gerenciar gêneros'));

    expect(onOpenGenres).toHaveBeenCalledTimes(1);
  });

  it('salva a meta e a Hoje recalcula na hora', async () => {
    await renderWithProviders(
      <>
        <AjustesScreen />
        <HojeScreen />
      </>,
    );

    expect(
      within(screen.getByTestId('meta-atual')).getByText('18 páginas'),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('18 páginas').length).toBeGreaterThanOrEqual(2);

    await fireEvent.changeText(screen.getByTestId('meta-diaria-campo'), '24');
    await fireEvent.press(screen.getByTestId('meta-diaria-salvar'));

    expect(
      within(screen.getByTestId('meta-atual')).getByText('24 páginas'),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('24 páginas').length).toBeGreaterThanOrEqual(2);
  });

  it('recusa meta fora do intervalo e mantém a anterior', async () => {
    await renderWithProviders(<AjustesScreen />);

    await fireEvent.changeText(screen.getByTestId('meta-diaria-campo'), '2');
    await fireEvent.press(screen.getByTestId('meta-diaria-salvar'));

    expect(
      screen.getByText('A meta fica entre 3 e 200 páginas.'),
    ).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('meta-atual')).getByText('18 páginas'),
    ).toBeOnTheScreen();
  });
});
