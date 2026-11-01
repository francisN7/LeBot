import { useEffect, useId } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
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
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
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

const PRESS_SPRING = { damping: 16, stiffness: 260 };

/**
 * Capa com o livro físico construído **sobre a própria foto**: sombra de vinco
 * à esquerda, sombra de borda à direita/base e luz no topo. Sem faixa de
 * páginas por cima da arte; o círculo de exemplo da S11a saiu.
 *
 * O selo com o rosto do status fica no canto inferior direito, com a mesma
 * piscada da lombada (`SpineFace`). `animated` só deve ser usado no detalhe:
 * numa grade, vários brilhos ao mesmo tempo distraem.
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
  const rawId = useId();
  const shadowId = `cover-depth-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

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

  // O selo acompanha o tamanho da capa: no compacto ele não pode dominar.
  const stampWidth = Math.min(26, Math.max(18, Math.round(width * 0.26)));
  const stampHeight = Math.round(stampWidth * 0.82);
  const faceHeight = Math.max(8, Math.round(stampHeight * 0.62));
  const faceWidth = Math.round(faceHeight * 1.125);

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

          {/* Profundidade S2: vinco de lombada + sombra de borda sobre a foto. */}
          <View
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            testID={testID ? `${testID}-depth` : undefined}
          >
            <Svg
              height="100%"
              preserveAspectRatio="none"
              viewBox="0 0 88 128"
              width="100%"
            >
              <Defs>
                <LinearGradient
                  id={`${shadowId}-hinge`}
                  x1="0"
                  x2="0.14"
                  y1="0"
                  y2="0"
                >
                  <Stop offset="0" stopColor="#000000" stopOpacity={0.38} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={0} />
                </LinearGradient>
                <LinearGradient
                  id={`${shadowId}-hinge-light`}
                  x1="0.13"
                  x2="0.2"
                  y1="0"
                  y2="0"
                >
                  <Stop offset="0" stopColor={colors.cream} stopOpacity={0} />
                  <Stop
                    offset="0.5"
                    stopColor={colors.cream}
                    stopOpacity={0.24}
                  />
                  <Stop offset="1" stopColor={colors.cream} stopOpacity={0} />
                </LinearGradient>
                <LinearGradient
                  id={`${shadowId}-right`}
                  x1="0.76"
                  x2="1"
                  y1="0"
                  y2="0"
                >
                  <Stop offset="0" stopColor="#000000" stopOpacity={0} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={0.42} />
                </LinearGradient>
                <LinearGradient
                  id={`${shadowId}-bottom`}
                  x1="0"
                  x2="0"
                  y1="0.88"
                  y2="1"
                >
                  <Stop offset="0" stopColor="#000000" stopOpacity={0} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={0.3} />
                </LinearGradient>
              </Defs>
              <Rect
                fill={`url(#${shadowId}-hinge)`}
                height="100%"
                width="100%"
              />
              <Rect
                fill={`url(#${shadowId}-hinge-light)`}
                height="100%"
                width="100%"
              />
              <Rect
                fill={`url(#${shadowId}-right)`}
                height="100%"
                width="100%"
              />
              <Rect
                fill={`url(#${shadowId}-bottom)`}
                height="100%"
                width="100%"
              />
              <Path
                d="M2 14 V114"
                fill="none"
                opacity={0.2}
                stroke={colors.cream}
                strokeWidth={1}
              />
            </Svg>
          </View>
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
            <Svg height={faceHeight} viewBox="14 70 36 32" width={faceWidth}>
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
