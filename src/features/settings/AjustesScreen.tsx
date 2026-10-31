import Constants from 'expo-constants';
import { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, Card, Chip, Screen } from '@/components/ui';
import { toSettingRows } from './rows';
import { useSettings } from './use-settings';

const appVersion = Constants.expoConfig?.version ?? '0.1.0';

export function AjustesScreen() {
  const { values } = useSettings();
  const settingsRows = useMemo(() => toSettingRows(values), [values]);

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Ajustes</AppText>
        <AppText tone="muted">Do seu jeito, sem culpa.</AppText>
      </View>

      <View className="gap-sm">
        {settingsRows.map((row) => (
          <Card className="gap-xs" key={row.id}>
            <View className="flex-row items-center justify-between">
              <AppText variant="bodyStrong">{row.label}</AppText>
              <Chip label={row.value} />
            </View>
            <AppText variant="caption" tone="muted">
              {row.hint}
            </AppText>
          </Card>
        ))}
      </View>

      <Card className="gap-xs">
        <AppText variant="subtitle">Sobre o LêBot</AppText>
        <AppText variant="caption" tone="muted">
          Versão {appVersion}. Seus dados ficam neste aparelho.
        </AppText>
        <AppText variant="caption" tone="muted">
          Feito para quem quer ler mais sem ressaca literária.
        </AppText>
      </Card>
    </Screen>
  );
}
