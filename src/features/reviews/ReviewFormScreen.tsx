import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import {
  AppText,
  BackButton,
  Button,
  Card,
  Chip,
  RatingStars,
  Screen,
  TextField,
} from '@/components/ui';
import { useBooks } from '@/features/library/use-books';

import { useReview, useReviewFields } from './use-reviews';

type ReviewFormScreenProps = {
  bookId: string;
  onDone: () => void;
  onCancel: () => void;
};

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível salvar a resenha.';
}

/**
 * Resenha de um livro concluído: nota, texto, citação e os campos extras
 * configurados, abertos por chip. Pular não apaga o que já estava salvo.
 */
export function ReviewFormScreen({
  bookId,
  onDone,
  onCancel,
}: ReviewFormScreenProps) {
  const { books } = useBooks();
  const { review, save } = useReview(bookId);
  const { fields } = useReviewFields();
  const found = books.find((book) => book.id === bookId);

  const [rating, setRating] = useState(review?.rating ?? 0);
  const [text, setText] = useState(review?.text ?? '');
  const [quote, setQuote] = useState(review?.quote ?? '');
  const [extras, setExtras] = useState<Record<string, string>>(
    review?.extras ?? {},
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!found) {
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

  function setExtra(fieldId: string, value: string) {
    setExtras((current) => ({ ...current, [fieldId]: value }));
  }

  function toggleField(fieldId: string) {
    // Acordeão: abrir um chip recolhe o anterior, sem perder o texto digitado.
    setExpanded((current) => (current === fieldId ? null : fieldId));
  }

  function submit() {
    if (rating < 1) {
      return;
    }

    try {
      save({ rating, text, quote, extras });
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
          {review ? 'Editar resenha' : 'Sua resenha'}
        </AppText>
        <AppText tone="muted">{found.title}</AppText>
      </View>

      <Card className="gap-md">
        <View className="gap-xs">
          <AppText variant="label">Sua nota</AppText>
          <RatingStars onChange={setRating} value={rating} />
          {rating < 1 ? (
            <AppText variant="caption" tone="muted">
              Escolha de 1 a 5 estrelas para salvar.
            </AppText>
          ) : null}
        </View>

        <TextField
          autoCapitalize="sentences"
          label="Resenha"
          multiline
          onChangeText={setText}
          placeholder="O que este livro deixou em você?"
          value={text}
        />

        <TextField
          autoCapitalize="sentences"
          hint="Opcional. Um trecho que ficou com você."
          label="Citação favorita"
          multiline
          onChangeText={setQuote}
          placeholder="Cole aqui o trecho"
          value={quote}
        />
      </Card>

      <View className="gap-sm">
        <View className="gap-xs">
          <AppText variant="label">Campos extras</AppText>
          <AppText variant="caption" tone="muted">
            {fields.length > 0
              ? 'Opcionais: toque em um chip para abrir e escrever.'
              : 'Nenhum campo criado. Adicione em Ajustes → Campos de resenha.'}
          </AppText>
        </View>

        {fields.length > 0 ? (
          <View className="flex-row flex-wrap gap-sm">
            {fields.map((field) => {
              const filled = (extras[field.id] ?? '').trim().length > 0;

              return (
                <View key={field.id} style={{ maxWidth: 200 }}>
                  <Chip
                    label={field.name}
                    onPress={() => toggleField(field.id)}
                    selected={filled || expanded === field.id}
                    testID={`campo-${field.id}`}
                  />
                </View>
              );
            })}
          </View>
        ) : null}

        {fields.map((field) => {
          if (expanded !== field.id) {
            return null;
          }

          return (
            <Animated.View
              entering={FadeInDown.duration(180)}
              exiting={FadeOutUp.duration(120)}
              key={field.id}
            >
              <Card className="gap-sm">
                <TextField
                  autoCapitalize="sentences"
                  label={field.name}
                  multiline
                  onChangeText={(value) => setExtra(field.id, value)}
                  placeholder="Escreva se quiser"
                  testID={`texto-${field.id}`}
                  value={extras[field.id] ?? ''}
                />
                <Button
                  label="Recolher"
                  onPress={() => setExpanded(null)}
                  size="sm"
                  variant="ghost"
                />
              </Card>
            </Animated.View>
          );
        })}
      </View>

      {formError ? <AppText tone="accent">{formError}</AppText> : null}

      <Button
        disabled={rating < 1}
        label="Salvar resenha"
        onPress={submit}
        testID="salvar-resenha"
      />
      <Button
        label="Agora não"
        onPress={onCancel}
        testID="pular-resenha"
        variant="ghost"
      />
    </Screen>
  );
}
