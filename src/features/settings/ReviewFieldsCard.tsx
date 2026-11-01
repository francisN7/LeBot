import { useState } from 'react';
import { View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  TextField,
} from '@/components/ui';
import { normalizeReviewFieldName } from '@/db/repositories/review-fields';
import type { ReviewFieldRow } from '@/db/schema';

import { useReviewFields } from '@/features/reviews/use-reviews';

/** Sugestões de campos que cobrem crítica, repertório e recomendação. */
export const suggestedReviewFields = [
  'O que melhorar?',
  'O que não gostei?',
  'Que repertório me deu?',
  'Para quem indico?',
] as const;

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível salvar o campo.';
}

/**
 * Campos extras globais da resenha. Cada um vira um chip no formulário; o
 * dono pode criar, renomear e excluir, e os valores saem junto na exclusão.
 */
export function ReviewFieldsCard() {
  const { fields, create, rename, remove } = useReviewFields();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<ReviewFieldRow | null>(null);
  const [editingName, setEditingName] = useState('');
  const [removing, setRemoving] = useState<ReviewFieldRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existing = new Set(
    fields.map((field) => normalizeReviewFieldName(field.name)),
  );
  const suggestions = suggestedReviewFields.filter(
    (name) => !existing.has(normalizeReviewFieldName(name)),
  );

  function add(name: string) {
    if (name.trim().length === 0) {
      setError('Dê um nome ao campo.');
      return;
    }

    try {
      create(name);
      setDraft('');
      setError(null);
    } catch (createError) {
      setError(messageOf(createError));
    }
  }

  function startRename(field: ReviewFieldRow) {
    setEditing(field);
    setEditingName(field.name);
    setError(null);
  }

  function confirmRename() {
    if (!editing) {
      return;
    }

    try {
      rename(editing.id, editingName);
      setEditing(null);
      setEditingName('');
      setError(null);
    } catch (renameError) {
      setError(messageOf(renameError));
    }
  }

  function confirmRemove() {
    if (removing) {
      remove(removing.id);
    }

    setRemoving(null);
  }

  return (
    <Card className="gap-sm" testID="campos-resenha">
      <View className="flex-row items-center justify-between gap-sm">
        <AppText variant="bodyStrong">Campos de resenha</AppText>
        <Chip
          label={fields.length === 1 ? '1 campo' : `${fields.length} campos`}
        />
      </View>
      <AppText variant="caption" tone="muted">
        Campos extras que aparecem como chips na resenha. Todos são opcionais.
      </AppText>

      {fields.length > 0 ? (
        <View className="gap-sm">
          {fields.map((field) =>
            editing?.id === field.id ? (
              <View className="gap-sm" key={field.id}>
                <TextField
                  autoCapitalize="sentences"
                  label="Nome do campo"
                  onChangeText={setEditingName}
                  testID="renomear-campo"
                  value={editingName}
                />
                <View className="flex-row flex-wrap gap-sm">
                  <Button
                    label="Salvar nome"
                    onPress={confirmRename}
                    size="sm"
                  />
                  <Button
                    label="Cancelar"
                    onPress={() => setEditing(null)}
                    size="sm"
                    variant="ghost"
                  />
                </View>
              </View>
            ) : (
              <View
                className="flex-row flex-wrap items-center justify-between gap-sm"
                key={field.id}
              >
                <AppText style={{ flex: 1 }} variant="body">
                  {field.name}
                </AppText>
                <View className="flex-row gap-xs">
                  <Button
                    label="Renomear"
                    onPress={() => startRename(field)}
                    size="sm"
                    variant="ghost"
                  />
                  <Button
                    label="Excluir"
                    onPress={() => setRemoving(field)}
                    size="sm"
                    variant="ghost"
                  />
                </View>
              </View>
            ),
          )}
        </View>
      ) : null}

      <TextField
        autoCapitalize="sentences"
        error={error ?? undefined}
        hint="Até 40 caracteres. Use uma pergunta curta."
        label="Adicionar campo"
        onChangeText={(value) => {
          setDraft(value);
          setError(null);
        }}
        placeholder="Ex.: O que aprendi?"
        testID="novo-campo-resenha"
        value={draft}
      />
      <Button
        disabled={draft.trim().length === 0}
        label="Adicionar"
        onPress={() => add(draft)}
        size="sm"
        variant="secondary"
      />

      {suggestions.length > 0 ? (
        <View className="gap-xs">
          <AppText variant="label" tone="muted">
            Sugestões
          </AppText>
          <View className="flex-row flex-wrap gap-sm">
            {suggestions.map((name) => (
              <Chip
                key={name}
                label={name}
                onPress={() => add(name)}
                testID={`sugestao-${name}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      <ConfirmDialog
        cancelLabel="Manter"
        confirmLabel="Excluir"
        message={
          removing
            ? `"${removing.name}" sai das resenhas e os textos desse campo são apagados.`
            : undefined
        }
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Excluir campo?"
        visible={removing !== null}
      />
    </Card>
  );
}
