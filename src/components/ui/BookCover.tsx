import { Image, Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { Bookmark } from '@/components/ui/Bookmark';
import { radii, sizes, spacing } from '@/theme';

type BookCoverProps = {
  uri: string;
  title: string;
  /** Cor do gênero, usada na fita do canto superior esquerdo. */
  genreColor: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  /** Sobrescreve o rótulo padrão (`Capa de <título>`). */
  accessibilityLabel?: string;
  className?: string;
  testID?: string;
};

/**
 * Capa com o acabamento dos cards: cantos `radii.md`, borda navy de 2 px e a
 * fita do gênero por cima, colada no topo com margem à esquerda.
 *
 * A borda fica dentro do tamanho da lombada e o `overflow: hidden` garante que
 * a imagem não vaze do arredondamento em telas de menor densidade.
 */
export function BookCover({
  uri,
  title,
  genreColor,
  width = sizes.spine.width,
  height = sizes.spine.height,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: BookCoverProps) {
  const label = accessibilityLabel ?? `Capa de ${title}`;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={onPress ? 'button' : 'image'}
      className={twMerge('active:opacity-80', className)}
      disabled={!onPress}
      onPress={onPress}
      style={{ width, height }}
      testID={testID}
    >
      <View
        className="overflow-hidden border-2 border-navy bg-surface"
        style={{ width, height, borderRadius: radii.md }}
      >
        <Image
          accessible={false}
          resizeMode="cover"
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View
        style={{ left: spacing.sm, position: 'absolute', top: 0 }}
        testID={testID ? `${testID}-bookmark` : undefined}
      >
        <Bookmark color={genreColor} />
      </View>
    </Pressable>
  );
}
