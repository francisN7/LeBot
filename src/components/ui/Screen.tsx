import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

import { spacing } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Desliga o scroll para telas curtas ou com lista virtualizada. */
  scroll?: boolean;
  className?: string;
  contentContainerClassName?: string;
  testID?: string;
};

/**
 * Casca de toda tela: fundo creme, safe area e padding lateral.
 * O conteúdo começa abaixo da status bar e termina antes da tab bar.
 */
export function Screen({
  children,
  scroll = true,
  className,
  contentContainerClassName,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  };

  if (!scroll) {
    return (
      <View
        className={twMerge('flex-1 bg-cream', className)}
        style={padding}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      className={twMerge('flex-1 bg-cream', className)}
      contentContainerClassName={twMerge('gap-lg', contentContainerClassName)}
      contentContainerStyle={padding}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {children}
    </ScrollView>
  );
}
