import { createRef, type ReactElement } from 'react';
import { withRepeat, withSequence } from 'react-native-reanimated';

import type { Book } from '@/features/library/types';
import { QueueRow } from '@/features/queue/QueueRow';
import { renderWithProviders } from '@/test-utils/render';

import { BookCover } from './BookCover';
import { Mascot } from './Mascot';
import type { ScreenScrollViewRef } from './Screen';
import { Spine } from './Spine';

/**
 * Regra da ADR 0029 nos componentes: animação ambiente toca uma rodada e para;
 * fora de foco ou com "reduzir movimento", não começa. O gate é trocado por um
 * interruptor; o próprio gate tem teste em `use-ambient-motion.test.tsx`.
 */
let mockGateOpen = true;

jest.mock('./use-ambient-motion', () => ({
  useAmbientMotion: (requested = true) => requested && mockGateOpen,
  useScreenFocused: () => mockGateOpen,
}));

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');

  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    withRepeat: jest.fn(actual.withRepeat),
    withSequence: jest.fn(actual.withSequence),
  };
});

const repeatMock = jest.mocked(withRepeat);
const sequenceMock = jest.mocked(withSequence);

const book: Book = {
  id: 'b1',
  title: 'Livro de teste',
  author: 'Autora Fictícia',
  genreId: 'g1',
  status: 'reading',
  pages: 200,
  pagesRead: 20,
  isbn: null,
  coverUri: null,
  updatedAt: new Date(2026, 0, 1),
};

const noop = () => undefined;

const cases: [string, () => ReactElement][] = [
  ['Mascot neutro', () => <Mascot />],
  ['Mascot sonolento', () => <Mascot state="sleepy" />],
  ['Mascot comemorando', () => <Mascot state="celebrating" />],
  [
    'Spine do detalhe',
    () => <Spine animated color="#E86A5C" status="reading" title="Livro" />,
  ],
  [
    'Spine na grade',
    () => <Spine color="#E86A5C" status="queued" title="Livro" />,
  ],
  [
    'Spine com sono',
    () => <Spine color="#E86A5C" status="paused" title="Livro" />,
  ],
  [
    'BookCover do detalhe',
    () => (
      <BookCover
        animated
        genreColor="#E86A5C"
        status="reading"
        title="Livro"
        uri="file:///capa.jpg"
      />
    ),
  ],
  [
    'QueueRow',
    () => (
      <QueueRow
        book={book}
        canMoveDown
        canMoveUp={false}
        genreColor="#E86A5C"
        genreName="Romance"
        isPrincipal
        note={null}
        onDown={noop}
        onDragEnd={noop}
        onDragMove={noop}
        onDragStart={noop}
        onDrop={noop}
        onHeight={noop}
        onOpen={noop}
        onUp={noop}
        position={1}
        scrollRef={createRef() as ScreenScrollViewRef}
      />
    ),
  ],
];

describe('animação ambiente nos componentes (ADR 0029)', () => {
  beforeEach(() => {
    mockGateOpen = true;
    repeatMock.mockClear();
    sequenceMock.mockClear();
  });

  it.each(cases)(
    '%s: com o gate aberto, nenhuma repetição infinita',
    async (_, element) => {
      await renderWithProviders(element());

      for (const [, reps] of repeatMock.mock.calls) {
        expect(reps).toBeGreaterThan(0);
      }
    },
  );

  it.each(cases)('%s: com o gate fechado, nada começa', async (_, element) => {
    mockGateOpen = false;

    await renderWithProviders(element());

    expect(repeatMock).not.toHaveBeenCalled();
    expect(sequenceMock).not.toHaveBeenCalled();
  });

  it('a lombada da grade e o mascote tocam uma rodada com o gate aberto', async () => {
    await renderWithProviders(
      <>
        <Mascot />
        <Spine color="#E86A5C" status="queued" title="Livro" />
      </>,
    );

    expect(
      repeatMock.mock.calls.length + sequenceMock.mock.calls.length,
    ).toBeGreaterThan(0);
  });
});
