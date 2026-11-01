import { useEffect } from 'react';
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
import type { ReadingStatus } from '@/features/library/types';
import { colors, contactShadow, opacities, radii, sizes } from '@/theme';

type SpineProps = {
  title: string;
  /** Cor de gênero vinda do banco (`genreById`), nunca uma lista fixa. */
  color: string;
  /**
   * Status de leitura. Com status a lombada é a arte 3D (rosto por status);
   * sem status fica o bloco 2D usado como fallback.
   */
  status?: ReadingStatus;
  /** Flutua devagar: reservado para telas com um livro só (detalhe). */
  animated?: boolean;
  width?: number;
  height?: number;
  onPress?: () => void;
  /** Esconde a etiqueta quando o título já aparece ao lado da lombada. */
  showLabel?: boolean;
  className?: string;
  testID?: string;
};

const PRESS_SPRING = { damping: 16, stiffness: 260 };

/**
 * Lombada do livro. A arte é vetorial e paramétrica: a cor vem do gênero e a
 * expressão do rosto do status (`resolveSpineArt`). Sem status, ou com hex
 * inválido, desenha o bloco 2D com etiqueta.
 *
 * Movimento: o toque inclina a lombada com mola (livro saindo da prateleira) e
 * `animated` adiciona uma flutuação contínua para a tela de detalhe. A etiqueta
 * de título fica sobre `cream` opaco para o texto pequeno não disputar contraste
 * com o rosto e o brilho.
 */
export function Spine({
  title,
  color,
  status,
  animated = false,
  width = sizes.spine.width,
  height = sizes.spine.height,
  onPress,
  showLabel = true,
  className,
  testID,
}: SpineProps) {
  const art = resolveSpineArt({ color, status });
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

  return (
    <Animated.View
      style={[{ height, width }, contactShadow, motion]}
      testID={testID ? `${testID}-frame` : undefined}
    >
      <Pressable
        accessibilityLabel={`Lombada de ${title}`}
        accessibilityRole={onPress ? 'button' : 'image'}
        className={twMerge('overflow-hidden border-2 border-navy', className)}
        disabled={!onPress}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, PRESS_SPRING);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, PRESS_SPRING);
        }}
        style={{
          backgroundColor: art.kind === 'art' ? art.palette.base : art.color,
          borderRadius: radii.sm,
          flex: 1,
        }}
        testID={testID}
      >
        {art.kind === 'art' ? (
          <View
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            testID={testID ? `${testID}-art` : undefined}
          >
            <SpineArtwork
              expression={art.expression}
              palette={art.palette}
              testID={testID}
            />
          </View>
        ) : (
          <View
            className="mx-sm mt-sm h-xs rounded-pill"
            style={{ backgroundColor: colors.navy, opacity: opacities.decor }}
          />
        )}
        <View className="mt-auto p-xs">
          {showLabel ? (
            <View className="rounded-sm bg-cream/95 px-xs py-xs">
              <AppText ellipsizeMode="tail" numberOfLines={2} variant="label">
                {title}
              </AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
