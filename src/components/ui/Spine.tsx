import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';
import { SpineArtwork } from '@/components/ui/SpineArtwork';
import { resolveSpineArt } from '@/features/library/spine-art';
import { fitSpineTitle } from '@/features/library/spine-label';
import type { ReadingStatus } from '@/features/library/types';
import { colors, contactShadow, opacities, radii, sizes } from '@/theme';

type SpineProps = {
  title: string;
  /** Cor de gênero vinda do banco (`genreById`), nunca uma lista fixa. */
  color: string;
  /**
   * Status de leitura. Com status a lombada é a arte B (rosto por status,
   * headband/tailband, nervuras e tassel); sem status fica o bloco 2D.
   */
  status?: ReadingStatus;
  /** Flutua devagar: reservado para telas com um livro só (detalhe). */
  animated?: boolean;
  /**
   * Liga os loops da arte (brilho, piscada, “zzz” e tassel). A grade passa
   * `false` para cards fora da tela ou durante a rolagem (S12b).
   */
  animating?: boolean;
  width?: number;
  height?: number;
  onPress?: () => void;
  /**
   * Etiqueta de título: no topo quando há arte, no rodapé no fallback 2D.
   * Desligue em tamanhos pequenos (mini-lombadas de "Meu ritmo").
   */
  showLabel?: boolean;
  className?: string;
  testID?: string;
};

const PRESS_SPRING = { damping: 16, stiffness: 260 };

/**
 * Lombada do livro. A arte é vetorial e paramétrica (`docs/design/assets-3d.md`):
 * a **cor** vem do gênero e a **expressão** do status (`resolveSpineArt`). Sem
 * status — ou com hex inválido — fica o bloco 2D chapado, que é o fallback.
 *
 * A arte B tem 64×128 (compacta 52×104): corpo cilíndrico, headband/tailband,
 * nervuras, rosto e tassel no topo-esquerdo. A etiqueta de título é uma View
 * (texto real, centralizado), não texto no SVG. O contorno navy vem da própria
 * arte; o `Pressable` fica transparente para não duplicar a borda.
 *
 * Movimento: o toque inclina com mola e `animated` liga a flutuação contínua —
 * reserve para telas com um livro só (detalhe), não para a grade.
 */
export function Spine({
  title,
  color,
  status,
  animated = false,
  animating = true,
  width = sizes.spine.width,
  height = sizes.spine.height,
  onPress,
  showLabel = true,
  className,
  testID,
}: SpineProps) {
  const art = useMemo(
    () => resolveSpineArt({ color, status }),
    [color, status],
  );
  const pressed = useSharedValue(0);
  const float = useSharedValue(1);

  useEffect(() => {
    if (!animated) {
      float.value = 1;
      return;
    }

    float.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [animated, float]);

  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateY: (float.value - 1) * -80 },
      { scale: float.value * (1 - pressed.value * 0.03) },
      { rotate: `${-pressed.value * 2}deg` },
    ],
  }));

  const scaleX = width / 64;
  const scaleY = height / 128;
  const labelFontSize = fitSpineTitle({
    title,
    width: 36 * scaleX,
    maxFontSize: 7 * scaleY,
    minFontSize: Math.max(4.5, 5 * scaleY),
  });
  const headLabel = showLabel ? (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        alignItems: 'center',
        backgroundColor: colors.cream,
        borderColor: colors.navy,
        borderRadius: 2 * scaleX,
        borderWidth: 1,
        height: 19 * scaleY,
        justifyContent: 'center',
        left: 11 * scaleX,
        position: 'absolute',
        top: 19 * scaleY,
        width: 42 * scaleX,
      }}
      testID={testID ? `${testID}-label` : undefined}
    >
      <AppText
        ellipsizeMode="tail"
        numberOfLines={2}
        style={{
          fontSize: labelFontSize,
          lineHeight: labelFontSize * 1.15,
          textAlign: 'center',
        }}
        variant="subtitle"
      >
        {title || 'Sem título'}
      </AppText>
    </View>
  ) : null;

  return (
    <Animated.View
      style={[{ height, width }, contactShadow, motion]}
      testID={testID ? `${testID}-frame` : undefined}
    >
      <Pressable
        accessibilityLabel={`Lombada de ${title}`}
        accessibilityRole={onPress ? 'button' : 'image'}
        className={twMerge(
          'overflow-hidden',
          art.kind === 'fallback' ? 'border-2 border-navy' : undefined,
          className,
        )}
        disabled={!onPress}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, PRESS_SPRING);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, PRESS_SPRING);
        }}
        style={{
          backgroundColor: art.kind === 'art' ? 'transparent' : art.color,
          borderRadius: art.kind === 'art' ? 0 : radii.sm,
          flex: 1,
        }}
        testID={testID}
      >
        {art.kind === 'art' ? (
          <>
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              testID={testID ? `${testID}-art` : undefined}
            >
              <SpineArtwork
                animating={animating}
                expression={art.expression}
                height={height}
                palette={art.palette}
                testID={testID}
                width={width}
              />
            </View>
            {headLabel}
          </>
        ) : (
          <>
            <View
              className="mx-sm mt-sm h-xs rounded-pill"
              style={{ backgroundColor: colors.navy, opacity: opacities.decor }}
            />
            {showLabel ? (
              <View className="mt-auto p-xs">
                <View className="rounded-sm bg-cream/95 px-xs py-xs">
                  <AppText
                    ellipsizeMode="tail"
                    numberOfLines={2}
                    variant="label"
                  >
                    {title}
                  </AppText>
                </View>
              </View>
            ) : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
