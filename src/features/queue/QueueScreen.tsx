import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
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

/**
 * Ordem automática: todo livro não concluído entra. Os `Lendo` formam o bloco
 * de cima, com o primeiro coroado como principal; `Quero ler` e `Pausado` ficam
 * abaixo. Registrar leitura continua sendo papel da Hoje.
 */
export function QueueScreen({ onOpenBook }: QueueScreenProps = {}) {
  const { books } = useBooks();
  const { genreById } = useGenres();
  const { items, move, replaceAll } = useQueue();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const heights = useRef(new Map<string, number>());

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

  function handleDrop(bookId: string, translationY: number) {
    const from = entries.findIndex((entry) => entry.bookId === bookId);

    if (from < 0) {
      return;
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
    target = reading
      ? Math.min(target, readingCount - 1)
      : Math.max(target, readingCount);

    if (target !== from) {
      move(bookId, target);
    }
  }

  function applySuggestion() {
    replaceAll(suggestion.map((item) => item.id));
  }

  function renderEntry(entry: QueueEntry, index: number) {
    const genre = genreById.get(entry.book.genreId);
    const reading = entry.book.status === 'reading';
    const groupStart = reading ? 0 : readingCount;
    const groupEnd = reading ? readingCount - 1 : entries.length - 1;

    return (
      <QueueRow
        book={entry.book}
        canMoveDown={index < groupEnd}
        canMoveUp={index > groupStart}
        genreColor={genre?.colorLight ?? colors.navyMuted}
        genreName={genre?.name ?? UNKNOWN_GENRE_NAME}
        isPrincipal={entry.bookId === principalId}
        key={entry.bookId}
        note={entry.note}
        onDown={() => move(entry.bookId, index + 1)}
        onDragEnd={() => setDraggingId(null)}
        onDragStart={() => setDraggingId(entry.bookId)}
        onDrop={(offset) => handleDrop(entry.bookId, offset)}
        onHeight={(height) => heights.current.set(entry.bookId, height)}
        onOpen={() => onOpenBook?.(entry.bookId)}
        onUp={() => move(entry.bookId, index - 1)}
        position={index}
      />
    );
  }

  const afterPrincipal = Math.max(
    0,
    entries.length - (readingCount > 0 ? 1 : 0),
  );

  return (
    <Screen scrollEnabled={draggingId === null}>
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
          {readingCount > 0 ? (
            <AppText tone="muted" variant="label">
              Lendo agora
            </AppText>
          ) : null}
          {entries
            .slice(0, readingCount)
            .map((entry, index) => renderEntry(entry, index))}
          {entries.length > readingCount ? (
            <AppText tone="muted" variant="label">
              Depois
            </AppText>
          ) : null}
          {entries
            .slice(readingCount)
            .map((entry, index) => renderEntry(entry, readingCount + index))}
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
