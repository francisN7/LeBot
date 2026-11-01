import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, BookArt, Card, Chip, Screen } from '@/components/ui';
import { useGenres } from '@/features/genres';
import { UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { ReadingStatus } from '@/features/library/types';
import { useBooks } from '@/features/library/use-books';
import { colors } from '@/theme';

import { queue } from './__fixtures__/queue';

/** Legenda escolhida na abertura da S7.1 (opção A). */
export const QUEUE_LEGEND =
  'A sequência é sua: o que ler depois do livro atual.';

/** Só os status que merecem selo: `queued` é o estado normal da ordem. */
const statusLabels: Partial<Record<ReadingStatus, string>> = {
  reading: 'Lendo',
  paused: 'Pausado',
  finished: 'Concluído',
};

function countLabel(count: number): string {
  return count === 1
    ? '1 livro depois do atual'
    : `${count} livros depois do atual`;
}

type QueueScreenProps = {
  onOpenBook?: (bookId: string) => void;
};

/**
 * Ordem do dono: a sequência guardada para depois do livro atual. Somente
 * leitura nesta sessão — registrar leitura é papel da Hoje (S7.1). Persistir,
 * adicionar e reordenar chegam na S8.
 */
export function QueueScreen({ onOpenBook }: QueueScreenProps = {}) {
  const { books } = useBooks();
  const { genreById } = useGenres();
  const booksById = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );

  // A ordem é fixture até a S8; livros apagados somem e não contam no total.
  const items = useMemo(
    () => queue.filter((item) => booksById.has(item.bookId)),
    [booksById],
  );

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Ordem</AppText>
        <AppText tone="muted">{QUEUE_LEGEND}</AppText>
        <AppText variant="caption" tone="muted">
          {countLabel(items.length)}
        </AppText>
      </View>

      {items.length === 0 ? (
        <Card className="items-center gap-xs">
          <AppText variant="subtitle">Sua ordem está vazia</AppText>
          <AppText variant="caption" tone="muted">
            Você ainda não escolheu o que vem depois do livro atual.
          </AppText>
        </Card>
      ) : (
        <View className="gap-sm">
          <AppText variant="subtitle">Na ordem</AppText>
          {items.map((item, index) => {
            const book = booksById.get(item.bookId);

            if (!book) {
              return null;
            }

            const genre = genreById.get(book.genreId);
            const statusLabel = statusLabels[book.status];

            return (
              <Pressable
                accessibilityLabel={`Abrir ${book.title}`}
                accessibilityRole="button"
                className="active:opacity-80"
                key={item.bookId}
                onPress={() => onOpenBook?.(book.id)}
              >
                <Card className="flex-row items-center gap-md">
                  <BookArt
                    book={book}
                    genreColor={genre?.colorLight ?? colors.navyMuted}
                    onPress={() => onOpenBook?.(book.id)}
                  />
                  <View className="flex-1 gap-xs">
                    <AppText variant="caption" tone="muted">
                      {`${index + 1}º na ordem`}
                    </AppText>
                    <AppText variant="bodyStrong">{book.title}</AppText>
                    <AppText variant="caption" tone="muted">
                      {`${book.author} · ${genre?.name ?? UNKNOWN_GENRE_NAME}`}
                    </AppText>
                    <AppText variant="caption">{item.note}</AppText>
                    {statusLabel ? <Chip label={statusLabel} /> : null}
                    {book.status === 'paused' ? (
                      <AppText variant="caption" tone="muted">
                        fora do plano enquanto estiver pausado
                      </AppText>
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      <AppText variant="caption" tone="muted">
        Reordenar e adicionar chega na S8.
      </AppText>
    </Screen>
  );
}
