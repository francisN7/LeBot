import type { ReactNode } from 'react';
import { View } from 'react-native';
import { twMerge } from 'tailwind-merge';

type CardProps = {
  children: ReactNode;
  className?: string;
  testID?: string;
};

/** Superfície branca com contorno navy: o bloco base da UI do LêBot. */
export function Card({ children, className, testID }: CardProps) {
  return (
    <View
      className={twMerge(
        'gap-sm rounded-lg border-2 border-navy bg-surface p-lg',
        className,
      )}
      testID={testID}
    >
      {children}
    </View>
  );
}
