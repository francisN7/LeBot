import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';

import { AppText, Button, Card, TextField } from '@/components/ui';

type ReadingFormProps = {
  visible: boolean;
  bookTitle: string;
  /** Páginas que ainda faltam para terminar o livro. */
  remaining: number;
  defaultPages?: number;
  onCancel: () => void;
  onSave: (pages: number) => void;
};

/** Aceita só dígitos e recusa zero; `null` quando o campo não serve. */
export function parseReadingPages(value: string): number | null {
  const digits = value.trim();

  if (!/^\d+$/.test(digits)) {
    return null;
  }

  const pages = Number(digits);
  return Number.isSafeInteger(pages) && pages > 0 ? pages : null;
}

/** Registro rápido de leitura: páginas lidas agora, com atalhos de +1/+10. */
export function ReadingForm({
  visible,
  bookTitle,
  remaining,
  defaultPages = 1,
  onCancel,
  onSave,
}: ReadingFormProps) {
  const [value, setValue] = useState(String(defaultPages));
  const [error, setError] = useState<string | null>(null);

  // Cada abertura começa do valor sugerido, sem herdar o que foi digitado antes.
  useEffect(() => {
    if (visible) {
      setValue(String(defaultPages));
      setError(null);
    }
  }, [visible, defaultPages]);

  const pages = parseReadingPages(value);
  const exceeds = pages !== null && pages > remaining;

  function change(next: string) {
    setValue(next);
    setError(null);
  }

  function add(amount: number) {
    change(String((parseReadingPages(value) ?? 0) + amount));
  }

  function save() {
    if (pages === null) {
      setError('Informe pelo menos 1 página.');
      return;
    }

    onSave(pages);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-navy/40 p-lg">
        <Card className="w-full gap-md" testID="reading-form">
          <View className="gap-xs">
            <AppText variant="subtitle">Registrar leitura</AppText>
            <AppText variant="caption" tone="muted">
              {bookTitle}
            </AppText>
          </View>

          <TextField
            error={error ?? undefined}
            hint={
              remaining === 1
                ? 'Falta 1 página para o fim.'
                : `Faltam ${remaining} páginas para o fim.`
            }
            keyboardType="number-pad"
            label="Páginas lidas"
            onChangeText={change}
            value={value}
          />

          <View className="flex-row gap-sm">
            <Button
              label="+1"
              onPress={() => add(1)}
              size="sm"
              variant="secondary"
            />
            <Button
              label="+10"
              onPress={() => add(10)}
              size="sm"
              variant="secondary"
            />
          </View>

          {exceeds ? (
            <AppText variant="caption" tone="accent">
              {remaining === 1
                ? 'Só falta 1 página: o progresso para no fim do livro.'
                : `Só faltam ${remaining} páginas: o progresso para no fim do livro.`}
            </AppText>
          ) : null}

          <View className="flex-row justify-end gap-sm">
            <Button
              label="Cancelar"
              onPress={onCancel}
              size="sm"
              variant="secondary"
            />
            <Button label="Salvar" onPress={save} size="sm" />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
