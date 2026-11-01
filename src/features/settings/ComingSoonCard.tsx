import { View } from 'react-native';

import { AppText, Card, Chip } from '@/components/ui';

type ComingSoonCardProps = {
  title: string;
  description: string;
};

/**
 * Recurso ainda não implementado: aparece com estado explícito em vez de um
 * valor falso ou de um botão que não faz nada.
 */
export function ComingSoonCard({ title, description }: ComingSoonCardProps) {
  return (
    <Card className="gap-xs">
      <View className="flex-row items-center justify-between gap-sm">
        <AppText variant="bodyStrong">{title}</AppText>
        <Chip label="Em breve" />
      </View>
      <AppText tone="muted" variant="caption">
        {description}
      </AppText>
    </Card>
  );
}
