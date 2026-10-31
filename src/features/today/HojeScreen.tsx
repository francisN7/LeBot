import { Alert, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Button, Card, Chip, Mascot, Screen } from '@/components/ui';
import { useSettings } from '@/features/settings';
import { dailyPlan } from './__fixtures__/daily-plan';
import type { PlanBlockStatus } from './types';

const blockStatusLabel: Record<PlanBlockStatus, string> = {
  done: 'Feito',
  next: 'Agora',
  later: 'Depois',
};

export function HojeScreen() {
  const { values } = useSettings();
  const goal =
    Number(values['goal.pages'] ?? dailyPlan.pages) || dailyPlan.pages;

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Hoje</AppText>
        <AppText tone="muted">{dailyPlan.dateLabel}</AppText>
      </View>

      <Animated.View entering={FadeInDown.delay(40).duration(260)}>
        <Card className="items-center gap-xs bg-pink">
          <AppText variant="label">Meta do dia</AppText>
          <AppText variant="display">{goal} páginas</AppText>
          <AppText variant="caption">
            cerca de {dailyPlan.minutes} minutos de leitura
          </AppText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(260)}>
        <Card className="flex-row items-center gap-md">
          <Mascot size={72} state="thinking" />
          <View className="flex-1 gap-xs">
            <AppText variant="label" tone="accent">
              LêBot diz
            </AppText>
            <AppText variant="subtitle">{dailyPlan.message}</AppText>
            <AppText variant="caption" tone="muted">
              Sequência de {dailyPlan.streak} dias. Sem pressão: se hoje não
              der, a gente ajusta.
            </AppText>
          </View>
        </Card>
      </Animated.View>

      <View className="gap-sm">
        <AppText variant="subtitle">Blocos de leitura</AppText>
        {dailyPlan.blocks.map((block) => (
          <Card className="flex-row items-center gap-md" key={block.id}>
            <View className="flex-1 gap-xs">
              <AppText variant="bodyStrong">{block.label}</AppText>
              <AppText variant="caption" tone="muted">
                {block.pages} páginas
              </AppText>
            </View>
            <Chip
              label={blockStatusLabel[block.status]}
              selected={block.status === 'next'}
            />
          </Card>
        ))}
      </View>

      <Button
        label="Começar sessão"
        onPress={() =>
          Alert.alert('Em breve', 'O registro de leitura chega na S5.')
        }
      />
    </Screen>
  );
}
