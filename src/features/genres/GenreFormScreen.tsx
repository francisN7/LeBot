import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  AppText,
  BackButton,
  Button,
  Card,
  ConfirmDialog,
  Screen,
  Spine,
  TextField,
} from '@/components/ui';
import { contrastRatio, MIN_CONTRAST } from '@/lib/genre-color';
import { colors, genrePalette, sizes } from '@/theme';

import {
  applyPreset,
  emptyGenreForm,
  formFromGenre,
  type GenreFormErrors,
  type GenreFormState,
  previewColor,
  startCustom,
  validateGenreForm,
} from './genre-form';
import { useGenres } from './use-genres';

type GenreFormScreenProps = {
  /** Presente ao editar; ausente ao cadastrar. */
  genreId?: string;
  onDone: () => void;
  onCancel: () => void;
};

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível salvar o gênero.';
}

/** Cadastro e edição de gênero: nome, preset de cores e cor personalizada. */
export function GenreFormScreen({
  genreId,
  onDone,
  onCancel,
}: GenreFormScreenProps) {
  const { genres, create, update, remove, repository } = useGenres();
  const existing = genreId
    ? genres.find((genre) => genre.id === genreId)
    : undefined;
  const [form, setForm] = useState<GenreFormState>(() =>
    existing ? formFromGenre(existing) : emptyGenreForm,
  );
  const [errors, setErrors] = useState<GenreFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  if (genreId && !existing) {
    return (
      <Screen>
        <AppText variant="title">Gênero não encontrado</AppText>
        <AppText tone="muted">
          Ele pode ter sido excluído. Volte para a lista e tente de novo.
        </AppText>
        <Button label="Voltar" onPress={onCancel} />
      </Screen>
    );
  }

  const usingBooks = existing ? repository.countBooks(existing.id) : 0;
  const appearanceContrast = (color: string) =>
    Math.max(
      contrastRatio(color, colors.cream),
      contrastRatio(color, colors.navy),
    );
  const lowContrast =
    appearanceContrast(form.colorLight) < MIN_CONTRAST ||
    appearanceContrast(form.colorDark) < MIN_CONTRAST;

  function updateField(
    field: 'name' | 'colorLight' | 'colorDark',
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function save() {
    if (saving) {
      return;
    }

    const result = validateGenreForm(form, genres, existing?.id);

    if (!result.ok) {
      setErrors(result.errors);
      setFormError(null);
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (existing) {
        update(existing.id, result.input);
      } else {
        create(result.input);
      }
    } catch (error) {
      const message = messageOf(error);

      if (message.includes('nome')) {
        setErrors({ name: message });
      } else {
        setFormError(message);
      }

      setSaving(false);
      return;
    }

    onDone();
  }

  function confirmDelete() {
    setConfirming(false);

    if (!existing) {
      return;
    }

    try {
      remove(existing.id);
    } catch (error) {
      setFormError(messageOf(error));
      return;
    }

    onDone();
  }

  return (
    <Screen>
      <BackButton onPress={onCancel} />

      <View className="gap-xs">
        <AppText variant="title">
          {existing ? 'Editar gênero' : 'Novo gênero'}
        </AppText>
        <AppText tone="muted">
          A cor aparece na lombada e na fita do livro.
        </AppText>
      </View>

      <Card className="gap-md">
        <TextField
          autoCapitalize="sentences"
          error={errors.name}
          label="Nome"
          onChangeText={(value) => updateField('name', value)}
          placeholder="Ex.: Poesia"
          value={form.name}
        />
      </Card>

      <View className="gap-sm">
        <AppText variant="label">Paleta</AppText>
        <View className="flex-row flex-wrap gap-sm">
          {genrePalette.map((entry) => {
            const selected =
              form.mode === 'preset' && form.paletteIndex === entry.index;

            return (
              <Pressable
                accessibilityLabel={`Paleta ${entry.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={
                  selected
                    ? 'rounded-md border-[3px] border-navy p-xs'
                    : 'rounded-md border-2 border-navy/30 p-xs'
                }
                key={entry.index}
                onPress={() =>
                  setForm((current) => applyPreset(current, entry.index))
                }
              >
                <View
                  className="overflow-hidden rounded-sm"
                  style={sizes.genreSwatch}
                >
                  <View
                    className="flex-1"
                    style={{ backgroundColor: entry.light }}
                  />
                  <View
                    className="flex-1"
                    style={{ backgroundColor: entry.dark }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
        <Button
          label={form.mode === 'custom' ? 'Usar a paleta' : 'Cor personalizada'}
          onPress={() =>
            setForm((current) =>
              current.mode === 'custom'
                ? applyPreset(current, current.paletteIndex)
                : startCustom(current),
            )
          }
          size="sm"
          variant="secondary"
        />
      </View>

      {form.mode === 'custom' ? (
        <Card className="gap-md">
          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.light}
            hint="Hex com 6 dígitos, ex.: #7B69EE"
            label="Cor clara"
            onChangeText={(value) => updateField('colorLight', value)}
            placeholder="#7B69EE"
            value={form.colorLight}
          />
          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.dark}
            hint="Par usado quando o tema escuro chegar."
            label="Cor escura"
            onChangeText={(value) => updateField('colorDark', value)}
            placeholder="#B3A7FF"
            value={form.colorDark}
          />
        </Card>
      ) : null}

      <View className="gap-sm">
        <AppText variant="label">Prévia</AppText>
        <View className="flex-row items-center gap-md">
          <Spine
            color={previewColor(form)}
            title={form.name.trim() || 'Prévia'}
          />
          <View className="flex-1 gap-sm">
            <View className="flex-row items-center gap-sm">
              <View
                className="rounded-sm border-2 border-navy"
                style={{
                  ...sizes.genreSwatch,
                  backgroundColor: previewColor(form),
                }}
              />
              <AppText variant="caption">{form.colorLight}</AppText>
            </View>
            <View className="flex-row items-center gap-sm">
              <View
                className="rounded-sm border-2 border-navy"
                style={{
                  ...sizes.genreSwatch,
                  backgroundColor: previewColor(form, 'dark'),
                }}
              />
              <AppText variant="caption">{form.colorDark}</AppText>
            </View>
          </View>
        </View>
        {lowContrast ? (
          <AppText variant="caption" tone="accent">
            Contraste baixo com o navy: a cor pode sumir no fundo. Dá para
            salvar assim mesmo.
          </AppText>
        ) : null}
      </View>

      {formError ? <AppText tone="accent">{formError}</AppText> : null}

      <Button
        disabled={saving}
        label={saving ? 'Salvando…' : 'Salvar gênero'}
        onPress={save}
      />
      <Button label="Cancelar" onPress={onCancel} variant="ghost" />

      {existing ? (
        <>
          <Button
            label="Excluir gênero"
            onPress={() => {
              setFormError(null);
              setConfirming(true);
            }}
            variant="secondary"
          />
          <ConfirmDialog
            cancelLabel="Cancelar"
            confirmLabel="Excluir"
            message={
              usingBooks > 0
                ? `Este gênero está em ${usingBooks} ${
                    usingBooks === 1 ? 'livro' : 'livros'
                  }. Troque o gênero antes de excluir.`
                : `"${existing.name}" sai da lista de gêneros.`
            }
            onCancel={() => setConfirming(false)}
            onConfirm={confirmDelete}
            title="Excluir gênero?"
            visible={confirming}
          />
        </>
      ) : null}
    </Screen>
  );
}
