import { useState } from 'react';
import { Alert, View } from 'react-native';

import {
  AppText,
  BookCover,
  Button,
  Card,
  Chip,
  Screen,
  TextField,
} from '@/components/ui';
import { readingStatuses } from '@/db/schema';
import { useGenres } from '@/features/genres';
import { useReadingSessions } from '@/features/reading/use-reading-sessions';
import { createId } from '@/lib/id';
import { formatIsbnInput, isValidIsbn, normalizeIsbn } from '@/lib/isbn';
import { colors } from '@/theme';

import { useCoverService } from './cover-context';
import {
  type BookFormErrors,
  type BookFormState,
  emptyBookForm,
  validateBookForm,
} from './form';
import { labelForStatus } from './genre';
import type { Book } from './types';
import { useBooks } from './use-books';

type BookFormScreenProps = {
  /** Presente ao editar; ausente ao cadastrar. */
  bookId?: string;
  onDone: () => void;
  onCancel: () => void;
};

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível salvar o livro.';
}

function toFormState(book: Book): BookFormState {
  return {
    title: book.title,
    author: book.author,
    genreId: book.genreId,
    status: book.status,
    pages: String(book.pages),
    pagesRead: String(book.pagesRead),
    isbn: book.isbn ?? '',
  };
}

/** Cadastro e edição compartilham a mesma tela; `bookId` decide o modo. */
export function BookFormScreen({
  bookId,
  onDone,
  onCancel,
}: BookFormScreenProps) {
  const { books, create, update } = useBooks();
  const { genres, genreById } = useGenres();
  const covers = useCoverService();
  const { sessions } = useReadingSessions(bookId ?? '');
  const existing = bookId
    ? books.find((book) => book.id === bookId)
    : undefined;

  const [form, setForm] = useState<BookFormState>(() =>
    existing
      ? toFormState(existing)
      : { ...emptyBookForm, genreId: genres[0]?.id ?? '' },
  );
  const [errors, setErrors] = useState<BookFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pickedCover, setPickedCover] = useState<string | null>(null);
  const [dropStoredCover, setDropStoredCover] = useState(false);
  const [saving, setSaving] = useState(false);

  if (bookId && !existing) {
    return (
      <Screen>
        <AppText variant="title">Livro não encontrado</AppText>
        <AppText tone="muted">
          Ele pode ter sido excluído. Volte para a estante e tente de novo.
        </AppText>
        <Button label="Voltar" onPress={onCancel} />
      </Screen>
    );
  }

  const storedCover = existing?.coverUri ?? null;
  const previewCover = pickedCover ?? (dropStoredCover ? null : storedCover);
  const recordedPages = sessions.reduce(
    (total, session) => total + session.appliedPages,
    0,
  );

  const isbnDigits = normalizeIsbn(form.isbn);
  const isbnComplete = isbnDigits.length === 10 || isbnDigits.length === 13;
  const isbnValid = isbnComplete && isValidIsbn(isbnDigits);

  function setText(
    field: 'title' | 'author' | 'pages' | 'pagesRead' | 'isbn',
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  async function pickCover() {
    try {
      const result = await covers.pick();

      if (result.status === 'picked') {
        setPickedCover(result.uri);
        setDropStoredCover(false);
      }
    } catch {
      Alert.alert(
        'Galeria indisponível',
        'Você ainda pode salvar o livro sem capa.',
      );
    }
  }

  function removeCover() {
    setPickedCover(null);
    setDropStoredCover(Boolean(storedCover));
  }

  async function save() {
    if (saving) {
      return;
    }

    const result = validateBookForm(form, null, recordedPages);

    if (!result.ok) {
      setErrors(result.errors);
      setFormError(null);
      return;
    }

    const id = existing?.id ?? createId('book');
    let coverUri = dropStoredCover ? null : storedCover;
    let savedNewCover = false;

    setSaving(true);
    setFormError(null);

    try {
      if (pickedCover) {
        coverUri = await covers.save(id, pickedCover);
        savedNewCover = true;
      }

      const input = { ...result.input, coverUri };

      if (existing) {
        update(existing.id, input);
      } else {
        create({ ...input, id });
      }
    } catch (error) {
      // Não deixa arquivo de capa órfão quando o livro não foi gravado.
      if (savedNewCover && coverUri) {
        await covers.remove(coverUri).catch(() => undefined);
      }

      setFormError(messageOf(error));
      setSaving(false);
      return;
    }

    if (dropStoredCover && storedCover) {
      await covers.remove(storedCover).catch(() => undefined);
    }

    onDone();
  }

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="title">
          {existing ? 'Editar livro' : 'Novo livro'}
        </AppText>
        <AppText tone="muted">
          Tudo fica neste aparelho. Nada é enviado para a internet.
        </AppText>
      </View>

      <Card className="gap-md">
        <TextField
          autoCapitalize="sentences"
          error={errors.title}
          label="Título"
          onChangeText={(value) => setText('title', value)}
          placeholder="O nome do livro"
          value={form.title}
        />
        <TextField
          autoCapitalize="words"
          error={errors.author}
          label="Autor"
          onChangeText={(value) => setText('author', value)}
          placeholder="Quem escreveu"
          value={form.author}
        />
        <TextField
          error={errors.pages}
          keyboardType="number-pad"
          label="Páginas"
          onChangeText={(value) => setText('pages', value)}
          placeholder="Ex.: 320"
          value={form.pages}
        />
        <TextField
          error={errors.pagesRead}
          hint={
            recordedPages > 0
              ? `Já registradas: ${recordedPages}. Para reduzir, desfaça as sessões no detalhe.`
              : 'Comece do zero ou de onde você parou.'
          }
          keyboardType="number-pad"
          label="Páginas lidas"
          onChangeText={(value) => setText('pagesRead', value)}
          placeholder="Ex.: 0"
          value={form.pagesRead}
        />
        <View className="gap-xs">
          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.isbn}
            hint="Opcional. Digite só os números; os hífens entram sozinhos."
            keyboardType="number-pad"
            label="ISBN"
            onChangeText={(value) => setText('isbn', formatIsbnInput(value))}
            placeholder="978-85-359-0277-2"
            value={form.isbn}
          />
          {isbnComplete && !errors.isbn ? (
            <AppText variant="caption" tone={isbnValid ? 'default' : 'accent'}>
              {isbnValid ? 'ISBN válido' : 'ISBN inválido'}
            </AppText>
          ) : null}
        </View>
      </Card>

      <View className="gap-sm">
        <AppText variant="label">Gênero</AppText>
        <View className="flex-row flex-wrap gap-sm">
          {genres.map((genre) => (
            <Chip
              key={genre.id}
              label={genre.name}
              onPress={() =>
                setForm((current) => ({ ...current, genreId: genre.id }))
              }
              selected={form.genreId === genre.id}
            />
          ))}
        </View>
        {genres.length === 0 ? (
          <AppText variant="caption" tone="muted">
            Cadastre um gênero em Ajustes para classificar o livro.
          </AppText>
        ) : null}
      </View>

      <View className="gap-sm">
        <AppText variant="label">Status</AppText>
        <View className="flex-row flex-wrap gap-sm">
          {readingStatuses.map((status) => (
            <Chip
              key={status}
              label={labelForStatus(status)}
              onPress={() => setForm((current) => ({ ...current, status }))}
              selected={form.status === status}
            />
          ))}
        </View>
      </View>

      <Card className="gap-sm">
        <AppText variant="label">Capa</AppText>
        {previewCover ? (
          <BookCover
            accessibilityLabel="Capa escolhida"
            genreColor={
              genreById.get(form.genreId)?.colorLight ?? colors.navyMuted
            }
            title={form.title.trim() || 'Sem título'}
            uri={previewCover}
          />
        ) : (
          <AppText variant="caption" tone="muted">
            Sem capa, usamos a lombada da cor do gênero.
          </AppText>
        )}
        <View className="flex-row flex-wrap gap-sm">
          <Button
            label={previewCover ? 'Trocar capa' : 'Escolher capa'}
            onPress={pickCover}
            size="sm"
            variant="secondary"
          />
          {previewCover ? (
            <Button
              label="Remover capa"
              onPress={removeCover}
              size="sm"
              variant="ghost"
            />
          ) : null}
        </View>
      </Card>

      {formError ? <AppText tone="accent">{formError}</AppText> : null}

      <Button
        disabled={saving}
        label={saving ? 'Salvando…' : 'Salvar livro'}
        onPress={save}
      />
      <Button label="Cancelar" onPress={onCancel} variant="ghost" />
    </Screen>
  );
}
