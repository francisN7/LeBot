import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';
import {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  radii,
  spacing,
} from '@/theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  testID?: string;
};

const inputStyle = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.navy,
    backgroundColor: colors.surface,
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
});

/** Campo de texto com rótulo, dica e mensagem de erro por campo. */
export function TextField({
  label,
  error,
  hint,
  className,
  testID,
  ...rest
}: TextFieldProps) {
  return (
    <View className={twMerge('gap-xs', className)} testID={testID}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.navyMuted}
        style={[
          inputStyle.base,
          { borderColor: error ? colors.coral : colors.navy },
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="accent">
          {error}
        </AppText>
      ) : null}
      {!error && hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
