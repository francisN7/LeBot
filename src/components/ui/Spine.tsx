import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';
import { colors, opacities, radii, sizes } from '@/theme';

type SpineProps = {
  title: string;
  /** Cor de gênero, sempre vinda de `colors` via `src/features/library/genre.ts`. */
  color: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  /** Esconde a etiqueta quando o título já aparece ao lado da lombada. */
  showLabel?: boolean;
  className?: string;
  testID?: string;
};

/**
 * Placeholder 2D da lombada: bloco colorido por gênero com etiqueta de título.
 * A versão 3D com expressão por status chega na S4.
 */
export function Spine({
  title,
  color,
  width = sizes.spine.width,
  height = sizes.spine.height,
  onPress,
  showLabel = true,
  className,
  testID,
}: SpineProps) {
  return (
    <Pressable
      accessibilityLabel={`Lombada de ${title}`}
      accessibilityRole={onPress ? 'button' : 'image'}
      className={twMerge(
        'overflow-hidden border-2 border-navy active:opacity-80',
        className,
      )}
      disabled={!onPress}
      onPress={onPress}
      style={{ backgroundColor: color, width, height, borderRadius: radii.md }}
      testID={testID}
    >
      <View
        className="mx-sm mt-sm h-xs rounded-pill"
        style={{ backgroundColor: colors.navy, opacity: opacities.decor }}
      />
      <View className="mt-auto p-sm">
        {showLabel ? (
          <View className="rounded-sm bg-cream/95 px-xs py-xs">
            <AppText variant="label" numberOfLines={2}>
              {title}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
