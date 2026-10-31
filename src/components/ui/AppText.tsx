import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontFamily, fontSize, lineHeight, opacities } from '@/theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label';

export type TextTone = 'default' | 'muted' | 'inverse' | 'accent';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

const variantStyles = StyleSheet.create({
  display: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
  },
  subtitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  /**
   * `label` não tem `letterSpacing`: o Android mede a linha sem o espaçamento
   * final e quebra a última letra em containers justos ("Terro/r", "Volta/r").
   */
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
  },
});

const toneStyles = StyleSheet.create({
  default: { color: colors.navy },
  muted: { color: colors.navy, opacity: opacities.muted },
  inverse: { color: colors.cream },
  accent: { color: colors.coral },
});

/** Texto com variantes da marca. Use `variant` para tamanho/peso e `tone` para cor. */
export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text {...rest} style={[variantStyles[variant], toneStyles[tone], style]} />
  );
}
