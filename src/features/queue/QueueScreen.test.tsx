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
  it('inclui os livros não concluídos e coroa o primeiro Lendo', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(screen.getByText('Ordem')).toBeOnTheScreen();
    expect(
      screen.getByText('A sequência é sua: o que ler depois do livro atual.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('3 livros depois do atual')).toBeOnTheScreen();
    expect(screen.getByText('Na ordem')).toBeOnTheScreen();
    expect(screen.getByText('Lendo agora')).toBeOnTheScreen();
    expect(screen.getByText('Depois')).toBeOnTheScreen();
    expect(screen.getByText('♛ 1º na ordem')).toBeOnTheScreen();
    expect(screen.getByText('Principal')).toBeOnTheScreen();
    expect(screen.getByLabelText('Arrastar O Hobbit')).toHaveProp(
      'accessibilityHint',
      'Segure e arraste para reordenar. As setas também movem.',
    );
    expect(screen.getByText('O Hobbit')).toBeOnTheScreen();
    expect(screen.getByText('Sapiens')).toBeOnTheScreen();
    expect(screen.getByText('Orgulho e Preconceito')).toBeOnTheScreen();
    expect(screen.getByText('Coraline')).toBeOnTheScreen();
    expect(screen.getByText('Pausado')).toBeOnTheScreen();
    expect(
      screen.queryByText('Clássico leve para alternar com a não-ficção'),
    ).not.toBeOnTheScreen();
    expect(
      screen.getByText('fora do plano enquanto estiver pausado'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'O primeiro Lendo é o principal. Quero ler e Pausado ficam abaixo; para subir, mude o status na Estante.',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Segure a alça e arraste, ou use as setas.'),
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

  it('não oferece adicionar nem remover: status é a entrada', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(screen.queryByLabelText('Adicionar livro')).not.toBeOnTheScreen();
    expect(
      screen.queryByLabelText('Remover Coraline da ordem'),
    ).not.toBeOnTheScreen();
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

    expect(screen.getByText('2 livros depois do atual')).toBeOnTheScreen();
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
    const books = createInMemoryBooksRepository([]);

    await renderWithProviders(<QueueScreen />, {
      booksRepository: books,
      queueRepository: createInMemoryQueueRepository(books, []),
    });

    expect(screen.getByText('Nenhum livro na ordem')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Concluídos não entram. Cadastre um livro ou mude o status na Estante.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('0 livros na ordem')).toBeOnTheScreen();
    expect(screen.queryByText('Na ordem')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Adicionar livro')).not.toBeOnTheScreen();
  });

  it('bloqueia Quero ler no topo e Lendo descendo para o bloco de baixo', async () => {
    await renderWithProviders(<QueueScreen />);

    expect(screen.getByLabelText('Subir Orgulho e Preconceito')).toBeDisabled();
    expect(screen.getByLabelText('Descer Sapiens')).toBeDisabled();
    expect(screen.getByLabelText('Subir Sapiens')).toBeEnabled();
    expect(screen.getByLabelText('Descer O Hobbit')).toBeEnabled();
  });

  it('reordena os Lendo e troca o principal pelas setas', async () => {
    await renderWithProviders(<QueueProbe />);

    expect(screen.getByTestId('queue-ids')).toHaveTextContent(
      'book-hobbit,book-sapiens,book-orgulho,book-coraline',
    );

    await fireEvent.press(screen.getByLabelText('Descer O Hobbit'));

    expect(screen.getByTestId('queue-ids')).toHaveTextContent(
      'book-sapiens,book-hobbit,book-orgulho,book-coraline',
    );
    expect(
      within(screen.getByTestId('queue-item-book-sapiens')).getByText(
        '♛ 1º na ordem',
      ),
    ).toBeOnTheScreen();
    expect(
      within(screen.getByTestId('queue-item-book-hobbit')).getByText(
        '2º na ordem',
      ),
    ).toBeOnTheScreen();
  });

  it('aplica a sugestão dentro de cada bloco', async () => {
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
