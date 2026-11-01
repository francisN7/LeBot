import { View } from 'react-native';

import { AppText } from '@/components/ui';

/** `1 página` / `3 páginas` — rótulo falado com plural correto. */
export function countLabel(value: number, one: string, many: string): string {
  return `${value} ${value === 1 ? one : many}`;
}

/** Número grande de um cartão de estatísticas (páginas, dias, livros). */
export function StatNumber({
  label,
  value,
  accessibilityLabel,
}: {
  label: string;
  value: number;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${value} ${label}`}
      accessible
      className="flex-1 items-center gap-xs"
    >
      <AppText variant="title">{value}</AppText>
      <AppText
        numberOfLines={1}
        style={{ textAlign: 'center' }}
        tone="muted"
        variant="label"
      >
        {label}
      </AppText>
    </View>
  );
}

/** Filete vertical entre os números de um mesmo cartão. */
export function StatDivider() {
  return (
    <View className="w-px self-stretch bg-navy" style={{ opacity: 0.15 }} />
  );
}
