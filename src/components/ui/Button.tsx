import { Pressable, StyleSheet } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';
import { colors, opacities, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  testID?: string;
  /** Nome falado; por padrão é o próprio rótulo visível. */
  accessibilityLabel?: string;
};

const surfaceStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.pink,
    borderColor: colors.navy,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.navy,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.coral,
    borderColor: colors.navy,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={twMerge(
        'flex-row items-center justify-center rounded-pill border-2 active:opacity-80',
        className,
      )}
      disabled={disabled}
      onPress={onPress}
      style={[
        surfaceStyles[variant],
        sizeStyles[size],
        disabled ? { opacity: opacities.disabled } : null,
      ]}
      testID={testID}
    >
      <AppText numberOfLines={1} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}
