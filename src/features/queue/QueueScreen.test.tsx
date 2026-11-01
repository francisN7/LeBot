import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  testBookRows,
} from '@/test-utils/repositories';

import { QueueScreen } from './QueueScreen';

describe('QueueScreen', () => {
  it('mostra a ordem com posição, nota e status', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(screen.getByText('Ordem')).toBeOnTheScreen();
    expect(
      screen.getByText('A sequência é sua: o que ler depois do livro atual.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('2 livros depois do atual')).toBeOnTheScreen();
    expect(screen.getByText('Na ordem')).toBeOnTheScreen();
    expect(screen.getByText('1º na ordem')).toBeOnTheScreen();
    expect(screen.getByText('2º na ordem')).toBeOnTheScreen();
    expect(screen.getByText('Orgulho e Preconceito')).toBeOnTheScreen();
    expect(screen.getByText('Coraline')).toBeOnTheScreen();
    expect(screen.getByText('Jane Austen · Clássico')).toBeOnTheScreen();
    expect(
      screen.getByText('Clássico leve para alternar com a não-ficção'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Reordenar e adicionar chega na S8.'),
    ).toBeOnTheScreen();
  });

  it('não registra leitura: sem Começar, modal ou páginas', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(screen.queryByText('Começar')).not.toBeOnTheScreen();
    expect(screen.queryByText('Registrar leitura')).not.toBeOnTheScreen();
    expect(screen.queryByText('Próxima parada')).not.toBeOnTheScreen();
    expect(screen.queryByText('20 páginas hoje')).not.toBeOnTheScreen();
    expect(screen.queryByText('15 pág.')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('reading-form')).not.toBeOnTheScreen();
  });

  it('marca o livro pausado e avisa que ele está fora do plano', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(screen.getByText('Pausado')).toBeOnTheScreen();
    expect(
      screen.getByText('fora do plano enquanto estiver pausado'),
    ).toBeOnTheScreen();
  });

  it('abre o detalhe ao tocar num livro da ordem', async () => {
    const onOpenBook = jest.fn();
    await renderWithProviders(<QueueScreen onOpenBook={onOpenBook} />);

    await fireEvent.press(screen.getByLabelText('Abrir Coraline'));

    expect(onOpenBook).toHaveBeenCalledWith('book-coraline');
  });

  it('ignora livro apagado no total e na lista', async () => {
    const withoutCoraline = testBookRows.filter(
      (row) => row.id !== 'book-coraline',
    );

    await renderWithProviders(<QueueScreen />, {
      booksRepository: createInMemoryBooksRepository(withoutCoraline),
    });

    expect(screen.getByText('1 livro depois do atual')).toBeOnTheScreen();
    expect(screen.queryByText('Coraline')).not.toBeOnTheScreen();
  });

  it('cai na lombada quando o livro não tem capa', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(
      screen.getByLabelText('Lombada de Orgulho e Preconceito'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Lombada de Coraline')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Capa de Coraline')).not.toBeOnTheScreen();
  });

  it('mostra a capa real na ordem', async () => {
    const withCovers = testBookRows.map((row) => ({
      ...row,
      coverUri: `covers/${row.id}.jpg`,
    }));

    await renderWithProviders(<QueueScreen />, {
      booksRepository: createInMemoryBooksRepository(withCovers),
    });

    expect(
      screen.getByLabelText('Capa de Orgulho e Preconceito'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Capa de Coraline')).toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Lombada de Coraline'),
    ).not.toBeOnTheScreen();
  });

  it('explica a ordem vazia sem oferecer ação falsa', async () => {
    await renderWithProviders(<QueueScreen />, {
      booksRepository: createInMemoryBooksRepository([]),
    });

    expect(screen.getByText('Sua ordem está vazia')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Você ainda não escolheu o que vem depois do livro atual.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('0 livros depois do atual')).toBeOnTheScreen();
    expect(screen.queryByText('Na ordem')).not.toBeOnTheScreen();
    expect(screen.queryByText('Começar')).not.toBeOnTheScreen();
  });
});
