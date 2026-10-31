import { useEffect } from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { twMerge } from 'tailwind-merge';

import { Bookmark } from '@/components/ui/Bookmark';
import { SpineFace } from '@/components/ui/SpineFace';
import { expressionByStatus } from '@/features/library/spine-art';
import type { ReadingStatus } from '@/features/library/types';
import { colors, radii, sizes, spacing } from '@/theme';

type BookCoverProps = {
  uri: string;
  title: string;
  /** Cor do gênero, usada na fita do canto superior esquerdo. */
  genreColor: string;
  /** Status de leitura: vira o selo de expressão no canto da capa. */
  status?: ReadingStatus;
  /** Faz o brilho atravessar a capa: use no detalhe, com um livro só. */
  animated?: boolean;
  width?: number;
  height?: number;
  onPress?: () => void;
  /** Sobrescreve o rótulo padrão (`Capa de <título>`). */
  accessibilityLabel?: string;
  className?: string;
  testID?: string;
};

const PRESS_SPRING = { damping: 16, stiffness: 260 };

/**
 * Capa com acabamento de livro físico: cantos `radii.md`, borda navy por dentro
 * do tamanho, fita do gênero, bloco de páginas na borda direita, brilho
 * diagonal e selo com o rosto do status.
 *
 * O bloco de páginas e o selo são o que fazem a foto parecer o mesmo objeto da
 * lombada 3D. `animated` só deve ser usado no detalhe: numa grade, vários
 * brilhos ao mesmo tempo distraem.
 */
export function BookCover({
  uri,
  title,
  genreColor,
  status,
  animated = false,
  width = sizes.spine.width,
  height = sizes.spine.height,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: BookCoverProps) {
  const label = accessibilityLabel ?? `Capa de ${title}`;
  const expression = status ? expressionByStatus[status] : undefined;
  const pressed = useSharedValue(0);
  const sheen = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      sheen.value = 0;
      return;
    }

    sheen.value = withRepeat(
      withSequence(
        withDelay(
          700,
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
        ),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, [animated, sheen]);

  const press = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - pressed.value * 0.03 },
      { rotate: `${-pressed.value * 1.5}deg` },
    ],
  }));

  const gloss = useAnimatedStyle(() => ({
    transform: [{ translateX: sheen.value * width * 1.7 }],
  }));

  const pageWidth = Math.max(4, Math.round(width * 0.07));
  // O selo acompanha o tamanho da capa: no compacto ele não pode dominar.
  const stampWidth = Math.min(26, Math.max(18, Math.round(width * 0.26)));
  const stampHeight = Math.round(stampWidth * 0.82);

  return (
    <Animated.View style={[{ height, width }, press]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole={onPress ? 'button' : 'image'}
        className={twMerge(className)}
        disabled={!onPress}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, PRESS_SPRING);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, PRESS_SPRING);
        }}
        style={{ height: '100%', width: '100%' }}
        testID={testID}
      >
        <View
          className="overflow-hidden border-2 border-navy bg-surface"
          style={{ borderRadius: radii.md, height, width }}
        >
          <Image
            accessible={false}
            resizeMode="cover"
            source={{ uri }}
            style={{ height: '100%', width: '100%' }}
          />

          {/* Bloco de páginas: a foto passa a ser um livro, não um retângulo. */}
          <View
            pointerEvents="none"
            style={{
              backgroundColor: colors.cream,
              bottom: 0,
              position: 'absolute',
              right: 0,
              top: 0,
              width: pageWidth,
            }}
          >
            {[0, 1, 2].map((line) => (
              <View
                key={line}
                style={{
                  backgroundColor: colors.navyMuted,
                  height: 1,
                  marginTop: line === 0 ? height * 0.28 : height * 0.18,
                  opacity: 0.3,
                  width: '100%',
                }}
              />
            ))}
          </View>

          <Animated.View
            pointerEvents="none"
            style={[
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                bottom: -height * 0.25,
                left: -width * 0.45,
                position: 'absolute',
                top: -height * 0.25,
                transform: [{ rotate: '18deg' }],
                width: width * 0.32,
              },
              gloss,
            ]}
          />
        </View>

        {expression ? (
          <View
            pointerEvents="none"
            style={{
              alignItems: 'center',
              backgroundColor: colors.cream,
              borderColor: colors.navy,
              borderRadius: radii.sm,
              borderWidth: 2,
              bottom: spacing.xs,
              height: stampHeight,
              justifyContent: 'center',
              position: 'absolute',
              right: spacing.xs,
              width: stampWidth,
            }}
            testID={testID ? `${testID}-stamp` : undefined}
          >
            <Svg
              height={Math.round(stampHeight * 0.55)}
              viewBox="26 50 48 36"
              width={Math.round(stampHeight * 0.73)}
            >
              <SpineFace expression={expression} ink={colors.navy} />
            </Svg>
          </View>
        ) : null}

        <View
          style={{ left: spacing.sm, position: 'absolute', top: 0 }}
          testID={testID ? `${testID}-bookmark` : undefined}
        >
          <Bookmark color={genreColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
