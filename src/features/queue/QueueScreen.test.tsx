import { fireEvent, screen, within } from '@testing-library/react-native';

import { AppText } from '@/components/ui';
import type { QueueItemRow } from '@/db/schema';
import { renderWithProviders } from '@/test-utils/render';
import {
  createInMemoryBooksRepository,
  createInMemoryQueueRepository,
  testBookRows,
} from '@/test-utils/repositories';

import { QueueScreen } from './QueueScreen';
import { useQueueBookIds } from './use-queue';

function queueRows(...bookIds: string[]): QueueItemRow[] {
  return bookIds.map((bookId, position) => ({
    bookId,
    position,
    note: null,
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
  }));
}

function QueueProbe() {
  const bookIds = useQueueBookIds();

  return (
    <>
      <QueueScreen />
      <AppText testID="queue-ids">{bookIds.join(',')}</AppText>
    </>
  );
}

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
      screen.getByText(
        'Arraste pela alça ou use as setas. A sequência também vale para o plano da Hoje.',
      ),
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

  it('explica a ordem vazia e leva a adicionar um livro', async () => {
    const books = createInMemoryBooksRepository();

    await renderWithProviders(<QueueScreen />, {
      booksRepository: books,
      queueRepository: createInMemoryQueueRepository(books, []),
    });

    expect(screen.getByText('Sua ordem está vazia')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Você ainda não escolheu o que vem depois do livro atual.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('0 livros depois do atual')).toBeOnTheScreen();
    expect(screen.queryByText('Na ordem')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Adicionar livro'));

    expect(screen.getByTestId('add-queue')).toBeOnTheScreen();
  });

  it('explica a estante vazia sem oferecer ação falsa', async () => {
    const books = createInMemoryBooksRepository([]);

    await renderWithProviders(<QueueScreen />, {
      booksRepository: books,
      queueRepository: createInMemoryQueueRepository(books, []),
    });

    expect(screen.getByText('Sua estante ainda está vazia')).toBeOnTheScreen();
    expect(
      screen.getByText('Cadastre um livro na Estante para começar a ordem.'),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText('Adicionar livro')).not.toBeOnTheScreen();
  });

  it('adiciona um livro pelo seletor da própria ordem', async () => {
    await renderWithProviders(<QueueScreen />);

    await fireEvent.press(screen.getByLabelText('Adicionar livro'));
    await fireEvent.press(screen.getByLabelText('Adicionar Sapiens'));
    await fireEvent.press(screen.getByLabelText('Fechar'));

    expect(screen.getByText('3 livros depois do atual')).toBeOnTheScreen();
    expect(screen.getByText('Sapiens')).toBeOnTheScreen();
  });

  it('remove com confirmação e mantém o livro na estante', async () => {
    await renderWithProviders(<QueueScreen />);

    await fireEvent.press(screen.getByLabelText('Remover Coraline da ordem'));

    expect(screen.getByText('Remover da ordem?')).toBeOnTheScreen();
    expect(
      screen.getByText('"Coraline" sai da sequência, mas continua na estante.'),
    ).toBeOnTheScreen();

    // O botão de confirmar usa o rótulo "Remover", não o padrão.
    await fireEvent.press(screen.getByLabelText('Remover'));
    expect(screen.queryByText('Coraline')).not.toBeOnTheScreen();
    expect(screen.getByText('1 livro depois do atual')).toBeOnTheScreen();
  });

  it('reordena pelas setas e avisa quem usa a ordem', async () => {
    await renderWithProviders(<QueueProbe />);

    expect(screen.getByTestId('queue-ids')).toHaveTextContent(
      'book-orgulho,book-coraline',
    );

    await fireEvent.press(
      screen.getByLabelText('Descer Orgulho e Preconceito'),
    );

    expect(screen.getByTestId('queue-ids')).toHaveTextContent(
      'book-coraline,book-orgulho',
    );
    expect(
      within(screen.getByTestId('queue-item-book-orgulho')).getByText(
        '2º na ordem',
      ),
    ).toBeOnTheScreen();
  });

  it('aplica a sugestão anti-ressaca alternando gêneros', async () => {
    const base = testBookRows[0];

    if (!base) {
      throw new Error('Seed de teste sem livro base');
    }

    const books = [
      { ...base, id: 'book-a', title: 'A', genreId: 'fantasy' },
      { ...base, id: 'book-b', title: 'B', genreId: 'fantasy' },
      { ...base, id: 'book-c', title: 'C', genreId: 'romance' },
    ];
    const booksRepository = createInMemoryBooksRepository(books);
    const queueRepository = createInMemoryQueueRepository(
      booksRepository,
      queueRows('book-a', 'book-b', 'book-c'),
    );

    await renderWithProviders(<QueueScreen />, {
      booksRepository,
      queueRepository,
    });

    await fireEvent.press(screen.getByLabelText('Sugerir ordem'));

    expect(
      within(screen.getByTestId('queue-item-book-c')).getByText('2º na ordem'),
    ).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('queue-item-book-b')).getByText('3º na ordem'),
    ).toBeOnTheScreen();
  });
});
