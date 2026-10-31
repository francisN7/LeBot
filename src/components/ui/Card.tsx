import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Sombra/profundidade e ajustes pontuais que não cabem em classe. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Superfície branca com contorno navy: o bloco base da UI do LêBot. */
export function Card({ children, className, style, testID }: CardProps) {
  return (
    <View
      className={twMerge(
        'gap-sm rounded-lg border-2 border-navy bg-surface p-lg',
        className,
      )}
      style={style}
      testID={testID}
    >
      {children}
    </View>
  );
}
