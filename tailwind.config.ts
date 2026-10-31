import nativewindPreset from 'nativewind/preset';
import type { Config } from 'tailwindcss';

import { colors } from './src/theme/colors';
import { radii } from './src/theme/radii';
import { spacing } from './src/theme/spacing';
import { fontFamily, fontSize, lineHeight } from './src/theme/typography';

const config = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors,
      spacing: {
        none: `${spacing.none}px`,
        xs: `${spacing.xs}px`,
        sm: `${spacing.sm}px`,
        md: `${spacing.md}px`,
        lg: `${spacing.lg}px`,
        xl: `${spacing.xl}px`,
        xxl: `${spacing.xxl}px`,
        xxxl: `${spacing.xxxl}px`,
      },
      borderRadius: {
        sm: `${radii.sm}px`,
        md: `${radii.md}px`,
        lg: `${radii.lg}px`,
        xl: `${radii.xl}px`,
        pill: `${radii.pill}px`,
      },
      fontFamily: {
        display: [fontFamily.display],
        heading: [fontFamily.heading],
        body: [fontFamily.body],
        'body-medium': [fontFamily.bodyMedium],
        'body-bold': [fontFamily.bodyBold],
      },
      fontSize: {
        xs: [`${fontSize.xs}px`, { lineHeight: `${lineHeight.xs}px` }],
        sm: [`${fontSize.sm}px`, { lineHeight: `${lineHeight.sm}px` }],
        md: [`${fontSize.md}px`, { lineHeight: `${lineHeight.md}px` }],
        lg: [`${fontSize.lg}px`, { lineHeight: `${lineHeight.lg}px` }],
        xl: [`${fontSize.xl}px`, { lineHeight: `${lineHeight.xl}px` }],
        xxl: [`${fontSize.xxl}px`, { lineHeight: `${lineHeight.xxl}px` }],
        display: [
          `${fontSize.display}px`,
          { lineHeight: `${lineHeight.display}px` },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
