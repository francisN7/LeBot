import { Pressable, type PressableProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  accessibilityHint?: string;
  accessibilityActions?: PressableProps['accessibilityActions'];
  onAccessibilityAction?: PressableProps['onAccessibilityAction'];
  className?: string;
  testID?: string;
};

/**
 * Etiqueta compacta; com `onPress` vira um filtro selecionável. Com
 * `onLongPress` também vira botão mesmo sem o toque simples (ex.: chip de
 * status da Estante, que abre a roda no toque longo).
 */
export function Chip({
  label,
  selected = false,
  onPress,
  onLongPress,
  delayLongPress,
  accessibilityHint,
  accessibilityActions,
  onAccessibilityAction,
  className,
  testID,
}: ChipProps) {
  const interactive = Boolean(onPress || onLongPress);

  return (
    <Pressable
      accessibilityActions={accessibilityActions}
      accessibilityHint={accessibilityHint}
      accessibilityRole={interactive ? 'button' : 'text'}
      accessibilityState={{ selected }}
      className={twMerge(
        'self-start rounded-pill border-2 border-navy px-md py-xs active:opacity-80',
        selected ? 'bg-navy' : 'bg-cream',
        className,
      )}
      delayLongPress={delayLongPress}
      disabled={!interactive}
      onAccessibilityAction={onAccessibilityAction}
      onLongPress={onLongPress}
      onPress={onPress}
      testID={testID}
    >
      <AppText
        numberOfLines={1}
        tone={selected ? 'inverse' : 'default'}
        variant="label"
      >
        {label}
      </AppText>
    </Pressable>
  );
}
