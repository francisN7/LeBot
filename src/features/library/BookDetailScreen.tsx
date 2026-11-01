import { useState } from 'react';
import { View } from 'react-native';

import {
  AppText,
  BackButton,
  BookCover,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Screen,
  Spine,
} from '@/components/ui';
import { useGenres } from '@/features/genres';
import { ReadingForm } from '@/features/reading/ReadingForm';
import { ReadingProgressCard } from '@/features/reading/ReadingProgressCard';
import type { ReadingSession } from '@/features/reading/types';
import { useReadingSessions } from '@/features/reading/use-reading-sessions';
import { ReviewCard } from '@/features/reviews/ReviewCard';
import { toReview } from '@/features/reviews/types';
import { useReview } from '@/features/reviews/use-reviews';
import { hasCover } from '@/lib/covers';
import { colors } from '@/theme';

import { useCoverService } from './cover-context';
import { labelForStatus, UNKNOWN_GENRE_NAME } from './genre';
import { useBooks } from './use-books';

type BookDetailScreenProps = {
  bookId: string;
  onBack: () => void;
  onEdit: () => void;
  onOpenReview?: () => void;
};

/** Ficha do livro: capa/lombada, dados e as ações de editar e excluir. */
export function BookDetailScreen({
  bookId,
  onBack,
  onEdit,
  onOpenReview,
}: BookDetailScreenProps) {
  const { books, remove } = useBooks();
  const { genreById } = useGenres();
  const covers = useCoverService();
  const { sessions, register, undo } = useReadingSessions(bookId);
  const { review } = useReview(bookId);
  const [confirming, setConfirming] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [undoing, setUndoing] = useState<ReadingSession | null>(null);
  const found = books.find((item) => item.id === bookId);

  if (!found) {
    return (
      <Screen>
        <AppText variant="title">Livro não encontrado</AppText>
        <AppText tone="muted">
          Ele pode ter sido excluído. Volte para a estante e tente de novo.
        </AppText>
        <Button label="Voltar" onPress={onBack} />
      </Screen>
    );
  }

  const book = found;
  const genre = genreById.get(book.genreId);
  const shownReview =
    book.status === 'finished' && review ? toReview(review) : undefined;

  async function deleteBook() {
    // A capa sai do disco mesmo que o arquivo já não exista.
    await covers.remove(book.coverUri).catch(() => undefined);
    remove(book.id);
    onBack();
  }

  function confirmDelete() {
    setConfirming(false);
    void deleteBook();
  }

  function confirmUndo() {
    if (undoing) {
      undo(undoing.id);
    }

    setUndoing(null);
  }

  return (
    <Screen>
      <BackButton onPress={onBack} />

      <View className="gap-xs">
        <AppText variant="display">{book.title}</AppText>
        <AppText tone="muted">{book.author}</AppText>
      </View>

      <Card className="gap-md">
        <View className="flex-row gap-md">
          {hasCover(book.coverUri) ? (
            <BookCover
              animated
              genreColor={genre?.colorLight ?? colors.navyMuted}
              status={book.status}
              title={book.title}
              uri={book.coverUri}
            />
          ) : (
            <Spine
              animated
              color={genre?.colorLight ?? colors.navyMuted}
              status={book.status}
              testID="detalhe-lombada"
              title={book.title}
            />
          )}
          <View className="flex-1 gap-sm">
            <View className="flex-row flex-wrap gap-xs">
              <Chip label={genre?.name ?? UNKNOWN_GENRE_NAME} />
              <Chip label={labelForStatus(book.status)} selected />
            </View>
            <View className="gap-xs">
              <AppText variant="label" tone="muted">
                Páginas
              </AppText>
              <AppText variant="subtitle">
                {book.pagesRead} de {book.pages}
              </AppText>
            </View>
            <View className="gap-xs">
              <AppText variant="label" tone="muted">
                ISBN
              </AppText>
              <AppText variant="caption">
                {book.isbn ?? 'Não informado'}
              </AppText>
            </View>
          </View>
        </View>
      </Card>

      <ReadingProgressCard
        book={book}
        onRegister={() => setRegistering(true)}
        onUndo={setUndoing}
        sessions={sessions}
      />

      {shownReview ? (
        <ReviewCard
          onEdit={onOpenReview ?? (() => undefined)}
          review={shownReview}
        />
      ) : null}

      {book.status === 'finished' && !shownReview ? (
        <Card className="gap-sm" testID="resenha-vazia">
          <AppText variant="label">Resenha</AppText>
          <AppText variant="caption" tone="muted">
            Você terminou este livro. Que tal guardar a impressão?
          </AppText>
          <Button
            label="Escrever resenha"
            onPress={onOpenReview}
            size="sm"
            variant="secondary"
          />
        </Card>
      ) : null}

      <Button label="Editar livro" onPress={onEdit} />
      <Button
        label="Excluir livro"
        onPress={() => setConfirming(true)}
        variant="secondary"
      />

      <ReadingForm
        bookTitle={book.title}
        onCancel={() => setRegistering(false)}
        onSave={(pages) => {
          const write = register(pages);
          setRegistering(false);

          // Chegar ao fim pela leitura é o momento canônico da resenha.
          if (write.book.status === 'finished') {
            onOpenReview?.();
          }
        }}
        remaining={book.pages - book.pagesRead}
        visible={registering}
      />

      <ConfirmDialog
        cancelLabel="Manter"
        confirmLabel="Desfazer"
        message={
          undoing
            ? `${undoing.appliedPages} páginas saem do progresso de "${book.title}".`
            : undefined
        }
        onCancel={() => setUndoing(null)}
        onConfirm={confirmUndo}
        title="Desfazer registro?"
        visible={undoing !== null}
      />

      <ConfirmDialog
        cancelLabel="Cancelar"
        confirmLabel="Excluir"
        message={`"${book.title}" sai da estante e da ordem. A capa também é apagada.`}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
        title="Excluir livro?"
        visible={confirming}
      />
    </Screen>
  );
}
