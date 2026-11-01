import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, ConfirmDialog, Screen } from '@/components/ui';
import { useGenres } from '@/features/genres';
import { UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';
import { useBooks } from '@/features/library/use-books';
import { colors, spacing } from '@/theme';

import { AddToQueueSheet } from './AddToQueueSheet';
import { QueueRow } from './QueueRow';
import { suggestOrder } from './suggest-order';
import { useQueue } from './use-queue';

/** Legenda escolhida na abertura da S7.1 (opção A). */
export const QUEUE_LEGEND =
  'A sequência é sua: o que ler depois do livro atual.';

function countLabel(count: number): string {
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
 * Ordem do dono: a sequência guardada para depois do livro atual. Montar e
 * reordenar acontece aqui; registrar leitura continua sendo papel da Hoje.
 */
export function QueueScreen({ onOpenBook }: QueueScreenProps = {}) {
  const { books } = useBooks();
  const { genreById } = useGenres();
  const { items, add, remove, move, replaceAll } = useQueue();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Book | null>(null);
  const heights = useRef(new Map<string, number>());

  const booksById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );

  // O repositório já ignora órfãos/concluídos; a tela repete a checagem para
  // não depender da ordem de atualização entre `useBooks` e `useQueue`.
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

  const queuedIds = useMemo(
    () => new Set(entries.map((entry) => entry.bookId)),
    [entries],
  );

  const candidates = useMemo(
    () =>
      books.filter(
        (book) => book.status !== 'finished' && !queuedIds.has(book.id),
      ),
    [books, queuedIds],
  );

  const suggestion = useMemo(
    () =>
      suggestOrder(
        entries.map((entry) => ({
          id: entry.bookId,
          genreId: entry.book.genreId,
        })),
      ),
    [entries],
  );

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

    if (target !== from) {
      move(bookId, target);
    }
  }

  function applySuggestion() {
    replaceAll(suggestion.map((item) => item.id));
  }

  function confirmRemove() {
    if (removing) {
      remove(removing.id);
    }

    setRemoving(null);
  }

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Ordem</AppText>
        <AppText tone="muted">{QUEUE_LEGEND}</AppText>
        <AppText tone="muted" variant="caption">
          {countLabel(entries.length)}
        </AppText>
      </View>

      {entries.length > 0 ? (
        <View className="flex-row flex-wrap gap-sm">
          <Button
            label="Adicionar livro"
            onPress={() => setAdding(true)}
            size="sm"
            variant="secondary"
          />
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
          <AppText variant="subtitle">
            {books.length === 0
              ? 'Sua estante ainda está vazia'
              : candidates.length === 0
                ? 'Nenhum livro disponível'
                : 'Sua ordem está vazia'}
          </AppText>
          <AppText tone="muted" variant="caption">
            {books.length === 0
              ? 'Cadastre um livro na Estante para começar a ordem.'
              : candidates.length === 0
                ? 'Concluídos não entram na ordem. Cadastre ou retome um livro na Estante.'
                : 'Você ainda não escolheu o que vem depois do livro atual.'}
          </AppText>
          {books.length === 0 || candidates.length === 0 ? null : (
            <Button
              label="Adicionar livro"
              onPress={() => setAdding(true)}
              size="sm"
            />
          )}
        </Card>
      ) : (
        <View className="gap-sm">
          <AppText variant="subtitle">Na ordem</AppText>
          {entries.map((entry, index) => {
            const genre = genreById.get(entry.book.genreId);

            return (
              <QueueRow
                book={entry.book}
                genreColor={genre?.colorLight ?? colors.navyMuted}
                genreName={genre?.name ?? UNKNOWN_GENRE_NAME}
                key={entry.bookId}
                note={entry.note}
                onDown={() => move(entry.bookId, index + 1)}
                onDrop={(offset) => handleDrop(entry.bookId, offset)}
                onHeight={(height) => heights.current.set(entry.bookId, height)}
                onOpen={() => onOpenBook?.(entry.bookId)}
                onRemove={() => setRemoving(entry.book)}
                onUp={() => move(entry.bookId, index - 1)}
                position={index}
                total={entries.length}
              />
            );
          })}
        </View>
      )}

      <AppText tone="muted" variant="caption">
        Arraste pela alça ou use as setas. A sequência também vale para o plano
        da Hoje.
      </AppText>

      <AddToQueueSheet
        books={candidates}
        genreNameById={genreById}
        onAdd={add}
        onClose={() => setAdding(false)}
        visible={adding}
      />

      <ConfirmDialog
        confirmLabel="Remover"
        message={
          removing
            ? `"${removing.title}" sai da sequência, mas continua na estante.`
            : undefined
        }
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remover da ordem?"
        visible={removing !== null}
      />
    </Screen>
  );
}
