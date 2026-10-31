import { Pressable } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
  testID?: string;
};

/** Etiqueta compacta; com `onPress` vira um filtro selecionável. */
export function Chip({
  label,
  selected = false,
  onPress,
  className,
  testID,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      className={twMerge(
        'self-start rounded-pill border-2 border-navy px-md py-xs active:opacity-80',
        selected ? 'bg-navy' : 'bg-cream',
        className,
      )}
      disabled={!onPress}
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
