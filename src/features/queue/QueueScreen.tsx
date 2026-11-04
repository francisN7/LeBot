import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Screen,
  type ScreenScrollViewRef,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';
import { useBooks } from '@/features/library/use-books';
import { colors, spacing } from '@/theme';

import { QueueRow } from './QueueRow';
import { suggestOrder } from './suggest-order';
import { useQueue } from './use-queue';

/** Legenda escolhida na abertura da S7.1 (opção A). */
export const QUEUE_LEGEND =
  'A sequência é sua: o que ler depois do livro atual.';

/**
 * Linhas por página. A Ordem não é virtualizada: com a estante cheia, montar
 * todas as `QueueRow` de uma vez (SVG, gesto e `LinearTransition` por linha)
 * travava a thread de JS até o Android abrir o diálogo de "não está
 * respondendo" (S12b). Dez por vez mantém a tela instantânea e o arrasto
 * previsível.
 */
export const QUEUE_PAGE_SIZE = 10;

function countLabel(count: number, hasPrincipal: boolean): string {
  if (!hasPrincipal) {
    return count === 1 ? '1 livro na ordem' : `${count} livros na ordem`;
  }

  return count === 1
    ? '1 livro depois do atual'
    : `${count} livros depois do atual`;
}

type QueueScreenProps = {
  onOpenBook?: (bookId: string) => void;
};

type QueueEntry = {
  bookId: string;
  note: string | null;
  book: Book;
};

type DragPreview = {
  from: number;
  target: number;
  height: number;
};

/**
 * Ordem automática: todo livro não concluído entra. Os `Lendo` formam o bloco
 * de cima, com o primeiro coroado como principal; `Quero ler` e `Pausado` ficam
 * abaixo. Registrar leitura continua sendo papel da Hoje.
 */
export function QueueScreen({ onOpenBook }: QueueScreenProps = {}) {
  const { books } = useBooks();
  const { genreById } = useGenres();
  const { items, move, replaceAll } = useQueue();
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [commitDrop, setCommitDrop] = useState(false);
  const [page, setPage] = useState(1);
  const dragPreviewRef = useRef<DragPreview | null>(null);
  const heights = useRef(new Map<string, number>());
  const scrollRef = useRef<ScreenScrollViewRef['current']>(null);

  // O drop já está na posição visual final (a prévia abriu o espaço). Uma
  // transição de layout aqui faria a linha "passear" de novo; desligamos só
  // nesse commit e religamos depois para as setas continuarem animadas.
  useEffect(() => {
    if (!commitDrop) {
      return;
    }

    const id = setTimeout(() => setCommitDrop(false), 80);
    return () => clearTimeout(id);
  }, [commitDrop]);

  const booksById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );

  const entries = useMemo<QueueEntry[]>(
    () =>
      items.flatMap((item) => {
        const book = booksById.get(item.bookId);

        return book && book.status !== 'finished'
          ? [{ bookId: item.bookId, note: item.note, book }]
          : [];
      }),
    [booksById, items],
  );

  const readingCount = useMemo(
    () => entries.filter((entry) => entry.book.status === 'reading').length,
    [entries],
  );

  const principalId = useMemo(
    () => entries.find((entry) => entry.book.status === 'reading')?.bookId,
    [entries],
  );

  const suggestion = useMemo(() => {
    const reading = entries
      .filter((entry) => entry.book.status === 'reading')
      .map((entry) => ({ id: entry.bookId, genreId: entry.book.genreId }));
    const others = entries
      .filter((entry) => entry.book.status !== 'reading')
      .map((entry) => ({ id: entry.bookId, genreId: entry.book.genreId }));

    return [...suggestOrder(reading), ...suggestOrder(others)];
  }, [entries]);

  const suggestionIsCurrent =
    suggestion.length === entries.length &&
    suggestion.every((item, index) => item.id === entries[index]?.bookId);

  const pageCount = Math.max(1, Math.ceil(entries.length / QUEUE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * QUEUE_PAGE_SIZE;
  const pageEnd = Math.min(pageStart + QUEUE_PAGE_SIZE, entries.length);
  const pageEntries = entries.slice(pageStart, pageEnd);

  function targetFor(
    bookId: string,
    translationY: number,
  ): { from: number; target: number } | null {
    const from = entries.findIndex((entry) => entry.bookId === bookId);

    if (from < 0) {
      return null;
    }

    let target = from;
    let remaining = translationY;

    if (translationY > 0) {
      while (target + 1 < entries.length) {
        const next = entries[target + 1];
        const height = next ? heights.current.get(next.bookId) : undefined;

        if (!height) {
          break;
        }

        const slot = height + spacing.sm;

        if (remaining <= slot / 2) {
          break;
        }

        remaining -= slot;
        target += 1;
      }
    } else {
      while (target > 0) {
        const previous = entries[target - 1];
        const height = previous
          ? heights.current.get(previous.bookId)
          : undefined;

        if (!height) {
          break;
        }

        const slot = height + spacing.sm;

        if (-remaining <= slot / 2) {
          break;
        }

        remaining += slot;
        target -= 1;
      }
    }

    const reading = entries[from]?.book.status === 'reading';
    const blockMin = reading ? 0 : readingCount;
    const blockMax = reading ? readingCount - 1 : entries.length - 1;

    // O arrasto não cruza páginas: o alvo fica dentro do bloco e da página.
    target = Math.min(
      Math.max(target, Math.max(blockMin, pageStart)),
      Math.min(blockMax, pageEnd - 1),
    );

    return { from, target };
  }

  /**
   * As setas andam na ordem inteira, inclusive entre páginas — é o único jeito
   * de o primeiro livro da página 2 chegar à página 1, já que o arrasto fica
   * preso à página. A tela acompanha o livro para a página de destino e rola
   * até onde ele caiu (fim ao subir, começo ao descer).
   */
  function moveAndFollow(bookId: string, target: number) {
    const next = move(bookId, target);
    const position = next.findIndex((row) => row.bookId === bookId);

    if (position < 0) {
      return;
    }

    const nextPage = Math.floor(position / QUEUE_PAGE_SIZE) + 1;

    if (nextPage === currentPage) {
      return;
    }

    const goingDown = nextPage > currentPage;
    setPage(nextPage);
    requestAnimationFrame(() => {
      if (goingDown) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } else {
        scrollRef.current?.scrollToEnd({ animated: false });
      }
    });
  }

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function clearDragPreview() {
    dragPreviewRef.current = null;
    setDragPreview(null);
  }

  function handleDragMove(bookId: string, translationY: number) {
    const result = targetFor(bookId, translationY);

    if (!result) {
      return;
    }

    const height = heights.current.get(bookId) ?? 0;
    const current = dragPreviewRef.current;

    if (
      current &&
      current.from === result.from &&
      current.target === result.target &&
      current.height === height
    ) {
      return;
    }

    const next = { ...result, height };
    dragPreviewRef.current = next;
    setDragPreview(next);
  }

  function handleDrop(bookId: string, translationY: number) {
    const result = targetFor(bookId, translationY);

    if (!result) {
      clearDragPreview();
      return;
    }

    // Espera o frame da soltura terminar antes de trocar a ordem. Assim a
    // prévia e a nova ordem não disputam o mesmo frame (era o "pisca").
    requestAnimationFrame(() => {
      setCommitDrop(true);
      clearDragPreview();

      if (result.target !== result.from) {
        move(bookId, result.target);
      }
    });
  }

  function previewShiftFor(index: number): number {
    if (!dragPreview || dragPreview.from === index) {
      return 0;
    }

    const distance = dragPreview.height + spacing.sm;

    if (dragPreview.from < index && index <= dragPreview.target) {
      return -distance;
    }

    if (dragPreview.from > index && index >= dragPreview.target) {
      return distance;
    }

    return 0;
  }

  function applySuggestion() {
    replaceAll(suggestion.map((item) => item.id));
    setPage(1);
  }

  function renderEntry(entry: QueueEntry, index: number) {
    const genre = genreById.get(entry.book.genreId);
    const reading = entry.book.status === 'reading';
    const groupStart = reading ? 0 : readingCount;
    const groupEnd = reading ? readingCount - 1 : entries.length - 1;

    return (
      <QueueRow
        animateLayout={!commitDrop}
        book={entry.book}
        canMoveDown={index < groupEnd}
        canMoveUp={index > groupStart}
        genreColor={genre?.colorLight ?? colors.navyMuted}
        genreName={genre?.name ?? UNKNOWN_GENRE_NAME}
        instantPreview={commitDrop}
        isPrincipal={entry.bookId === principalId}
        key={entry.bookId}
        note={entry.note}
        onDown={() => moveAndFollow(entry.bookId, index + 1)}
        onDragEnd={() => {
          clearDragPreview();
        }}
        onDragMove={(offset) => handleDragMove(entry.bookId, offset)}
        onDragStart={() => {
          setCommitDrop(false);
          clearDragPreview();
        }}
        onDrop={(offset) => handleDrop(entry.bookId, offset)}
        onHeight={(height) => heights.current.set(entry.bookId, height)}
        onOpen={() => onOpenBook?.(entry.bookId)}
        onUp={() => moveAndFollow(entry.bookId, index - 1)}
        position={index}
        previewShift={previewShiftFor(index)}
        scrollRef={scrollRef}
      />
    );
  }

  const afterPrincipal = Math.max(
    0,
    entries.length - (readingCount > 0 ? 1 : 0),
  );

  return (
    <Screen scrollRef={scrollRef}>
      <View className="gap-xs">
        <AppText variant="display">Ordem</AppText>
        <AppText tone="muted">{QUEUE_LEGEND}</AppText>
        <AppText tone="muted" variant="caption">
          {countLabel(afterPrincipal, readingCount > 0)}
        </AppText>
      </View>

      {entries.length > 0 ? (
        <View className="flex-row flex-wrap gap-sm">
          <Button
            disabled={entries.length < 2 || suggestionIsCurrent}
            label="Sugerir ordem"
            onPress={applySuggestion}
            size="sm"
            variant="secondary"
          />
        </View>
      ) : null}

      {entries.length === 0 ? (
        <Card className="items-center gap-xs">
          <AppText variant="subtitle">Nenhum livro na ordem</AppText>
          <AppText tone="muted" variant="caption">
            Concluídos não entram. Cadastre um livro ou mude o status na
            Estante.
          </AppText>
        </Card>
      ) : (
        <View className="gap-sm">
          <AppText variant="subtitle">Na ordem</AppText>
          {pageEntries.map((entry, index) => {
            const position = pageStart + index;

            return (
              <Fragment key={entry.bookId}>
                {position === 0 && readingCount > 0 ? (
                  <AppText tone="muted" variant="label">
                    Lendo agora
                  </AppText>
                ) : null}
                {position === readingCount && entries.length > readingCount ? (
                  <AppText tone="muted" variant="label">
                    Depois
                  </AppText>
                ) : null}
                {renderEntry(entry, position)}
              </Fragment>
            );
          })}
          {pageCount > 1 ? (
            <View className="flex-row items-center justify-between gap-sm">
              <Button
                disabled={currentPage === 1}
                label="Anterior"
                onPress={() => goToPage(currentPage - 1)}
                size="sm"
                variant="secondary"
              />
              <AppText tone="muted" variant="caption">
                {`${pageStart + 1}–${pageEnd} de ${entries.length}`}
              </AppText>
              <Button
                disabled={currentPage === pageCount}
                label="Próxima"
                onPress={() => goToPage(currentPage + 1)}
                size="sm"
                variant="secondary"
              />
            </View>
          ) : null}
        </View>
      )}

      <View className="gap-xs">
        <AppText tone="muted" variant="caption">
          O primeiro Lendo é o principal. Quero ler e Pausado ficam abaixo; para
          subir, mude o status na Estante.
        </AppText>
        <AppText tone="muted" variant="caption">
          Segure a alça e arraste, ou use as setas.
        </AppText>
      </View>
    </Screen>
  );
}
