import type { ComponentRef, ReactNode, RefObject } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { twMerge } from 'tailwind-merge';

import { spacing } from '@/theme';

/** Tipo do `ScrollView` do gesture handler, usado para bloquear o arrastar. */
export type ScreenScrollViewRef = RefObject<ComponentRef<
  typeof ScrollView
> | null>;

type ScreenProps = {
  children: ReactNode;
  /** Desliga o scroll para telas curtas ou com lista virtualizada. */
  scroll?: boolean;
  /** Permite travar a rolagem enquanto uma linha está sendo arrastada. */
  scrollEnabled?: boolean;
  /** Ref usado pelo gesto de arrastar para bloquear a rolagem nativa. */
  scrollRef?: ScreenScrollViewRef;
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
  scrollEnabled = true,
  scrollRef,
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
      ref={scrollRef}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      {children}
    </ScrollView>
  );
}
