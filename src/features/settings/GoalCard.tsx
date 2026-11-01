import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Chip, TextField } from '@/components/ui';

import { DEFAULT_GOAL_PAGES, goalInputValue, parseGoalInput } from './goal';
import { useSettings } from './use-settings';

function savedPages(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : DEFAULT_GOAL_PAGES;
}

/** Meta diária editável no próprio Ajustes; a Hoje recalcula na hora. */
export function GoalCard() {
  const { values, setValue } = useSettings();
  const [draft, setDraft] = useState(() =>
    goalInputValue(values['goal.pages']),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    const result = parseGoalInput(draft);

    if (!result.ok) {
      setError(result.message);
      setSaved(false);
      return;
    }

    setValue('goal.pages', String(result.pages));
    setDraft(String(result.pages));
    setError(null);
    setSaved(true);
  }

  return (
    <Card className="gap-sm" testID="meta-diaria">
      <View className="flex-row items-center justify-between gap-sm">
        <AppText variant="bodyStrong">Meta diária</AppText>
        <Chip
          label={`${savedPages(values['goal.pages'])} páginas`}
          testID="meta-atual"
        />
      </View>
      <AppText variant="caption" tone="muted">
        Entre 3 e 200 páginas. A Hoje usa esse valor hoje mesmo e pode aliviar
        em dias de volta.
      </AppText>

      <TextField
        autoCorrect={false}
        error={error ?? undefined}
        hint="Páginas por dia."
        inputMode="numeric"
        keyboardType="number-pad"
        label="Páginas por dia"
        maxLength={3}
        onChangeText={(value) => {
          setDraft(value);
          setError(null);
          setSaved(false);
        }}
        onSubmitEditing={save}
        returnKeyType="done"
        testID="meta-diaria-campo"
        value={draft}
      />
      <Button
        label="Salvar meta"
        onPress={save}
        size="sm"
        testID="meta-diaria-salvar"
      />
      {saved && !error ? (
        <AppText tone="muted" variant="caption">
          Meta salva.
        </AppText>
      ) : null}
    </Card>
  );
}
