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
import Svg, { Path } from 'react-native-svg';
import { twMerge } from 'tailwind-merge';

import { Bookmark } from '@/components/ui/Bookmark';
import { SpineFace } from '@/components/ui/SpineFace';
import { expressionByStatus } from '@/features/library/spine-art';
import type { ReadingStatus } from '@/features/library/types';
import { colors, contactShadow, radii, sizes, spacing } from '@/theme';

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

/** Bloco de páginas em coordenadas locais (11% da capa). */
const PAGES = {
  width: 12,
  height: 128,
  path: 'M0 1 L12 3.5 V124.5 L0 127 Z',
  crease: 'M0.7 1 V127',
  lines: [
    { width: 7.2, y: 18 },
    { width: 5.6, y: 32 },
    { width: 8.4, y: 46 },
    { width: 6.4, y: 60 },
    { width: 8.9, y: 74 },
    { width: 5.2, y: 88 },
    { width: 7.6, y: 102 },
    { width: 6.8, y: 116 },
  ],
} as const;

const PRESS_SPRING = { damping: 16, stiffness: 260 };

/**
 * Capa com acabamento de livro físico: cantos `radii.md`, borda navy por dentro
 * do tamanho, fita do gênero, bloco de páginas em perspectiva, brilho diagonal
 * e selo com o rosto do status.
 *
 * O bloco de páginas e o selo fazem a foto parecer o mesmo objeto da lombada 3D.
 * `animated` só deve ser usado no detalhe: numa grade, vários brilhos ao mesmo
 * tempo distraem.
 */
export function BookCover({
  uri,
  title,
  genreColor,
  status,
  animated = false,
  width = sizes.cover.width,
  height = sizes.cover.height,
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

  const pageWidth = Math.max(7, Math.round(width * 0.11));
  // O selo acompanha o tamanho da capa: no compacto ele não pode dominar.
  const stampWidth = Math.min(26, Math.max(18, Math.round(width * 0.26)));
  const stampHeight = Math.round(stampWidth * 0.82);
  const faceHeight = Math.max(8, Math.round(stampHeight * 0.62));
  const faceWidth = Math.round(faceHeight * 0.91);

  return (
    <Animated.View
      style={[{ height, width }, contactShadow, press]}
      testID={testID ? `${testID}-frame` : undefined}
    >
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

          {/* Bloco de páginas: trapézio creme com níveis que leem como texto. */}
          <View
            pointerEvents="none"
            style={{
              bottom: 0,
              position: 'absolute',
              right: 0,
              top: 0,
              width: pageWidth,
            }}
            testID={testID ? `${testID}-pages` : undefined}
          >
            <Svg
              height="100%"
              preserveAspectRatio="none"
              viewBox={`0 0 ${PAGES.width} ${PAGES.height}`}
              width="100%"
            >
              <Path d={PAGES.path} fill={colors.cream} />
              {PAGES.lines.map((line) => (
                <Path
                  d={`M1.6 ${line.y} H${1.6 + line.width}`}
                  key={line.y}
                  opacity={0.45}
                  stroke={colors.navyMuted}
                  strokeLinecap="round"
                  strokeWidth={0.9}
                />
              ))}
              <Path
                d={PAGES.crease}
                opacity={0.28}
                stroke={colors.navy}
                strokeWidth={1}
              />
            </Svg>
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
              right: pageWidth + spacing.xs,
              width: stampWidth,
            }}
            testID={testID ? `${testID}-stamp` : undefined}
          >
            <Svg height={faceHeight} viewBox="9 47 29 32" width={faceWidth}>
              <SpineFace
                expression={expression}
                ink={colors.navy}
                testID={
                  testID ? `${testID}-stamp-face-${expression}` : undefined
                }
              />
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
