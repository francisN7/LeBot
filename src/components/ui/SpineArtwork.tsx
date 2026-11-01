import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';

import type {
  SpineExpression,
  SpinePalette,
} from '@/features/library/spine-art';

import { SpineEyes, SpineMouth } from './SpineFace';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Raio do corpo no viewBox 100×140; acompanha `radii.md` na proporção. */
const ART_RADIUS = 14;

/** Corpo com canto direito arredondado, onde entra a faixa de sombra. */
const BODY_PATH = `M0 ${ART_RADIUS} Q0 0 ${ART_RADIUS} 0 H${100 - ART_RADIUS} Q100 0 100 ${ART_RADIUS} V${140 - ART_RADIUS} Q100 140 ${100 - ART_RADIUS} 140 H${ART_RADIUS} Q0 140 0 ${140 - ART_RADIUS} Z`;

const SHADE_PATH = `M76 0 H86 Q100 0 100 ${ART_RADIUS} V${140 - ART_RADIUS} Q100 140 86 140 H76 Z`;

type SpineArtworkProps = {
  expression: SpineExpression;
  palette: SpinePalette;
  testID?: string;
};

/**
 * Desenho da lombada 3D: corpo na cor do gênero, faixa de sombra à direita,
 * brilho à esquerda, faixas superior/inferior e o rosto do status.
 *
 * A vida vem de três animações discretas, todas no eixo do UI thread:
 * piscada (olhos), brilho que atravessa a lombada e o "z" pulsando no sono.
 * O viewBox é fixo (100×140), então o mesmo desenho serve ao tamanho cheio e
 * ao compacto da Ordem.
 */
export function SpineArtwork({
  expression,
  palette,
  testID,
}: SpineArtworkProps) {
  const blink = useSharedValue(1);
  const sheen = useSharedValue(-40);
  const asleep = useSharedValue(1);

  const canBlink = expression === 'neutral' || expression === 'happy';

  useEffect(() => {
    if (!canBlink) {
      blink.value = 1;
      return;
    }

    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600 }),
        withTiming(0, { duration: 70 }),
        withTiming(1, { duration: 90 }),
        withTiming(1, { duration: 180 }),
      ),
      -1,
    );
  }, [blink, canBlink]);

  useEffect(() => {
    sheen.value = -40;
    sheen.value = withRepeat(
      withSequence(
        withDelay(
          1800,
          withTiming(140, {
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        withTiming(-40, { duration: 0 }),
      ),
      -1,
    );
  }, [sheen]);

  useEffect(() => {
    if (expression !== 'sleepy') {
      asleep.value = 1;
      return;
    }

    asleep.value = withRepeat(
      withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [asleep, expression]);

  const eyesProps = useAnimatedProps(() => ({ opacity: blink.value }));
  const sheenProps = useAnimatedProps(() => ({ x: sheen.value }));
  const asleepProps = useAnimatedProps(() => ({ opacity: asleep.value }));

  return (
    <Svg
      accessibilityElementsHidden
      height="100%"
      importantForAccessibility="no-hide-descendants"
      preserveAspectRatio="none"
      testID={testID}
      viewBox="0 0 100 140"
      width="100%"
    >
      <Path d={BODY_PATH} fill={palette.base} />
      <Path d={SHADE_PATH} fill={palette.shade} opacity={0.6} />
      <Rect
        fill={palette.highlight}
        height={8}
        opacity={0.9}
        rx={4}
        width={80}
        x={10}
        y={10}
      />
      <Rect
        fill={palette.highlight}
        height={8}
        opacity={0.9}
        rx={4}
        width={80}
        x={10}
        y={122}
      />
      <Rect
        fill={palette.highlight}
        height={92}
        opacity={0.14}
        width={6}
        x={10}
        y={24}
      />
      <AnimatedRect
        animatedProps={sheenProps}
        fill={palette.highlight}
        height={180}
        opacity={expression === 'shine' ? 0.42 : 0.22}
        width={16}
        y={-20}
      />
      <AnimatedG animatedProps={eyesProps}>
        <SpineEyes expression={expression} ink={palette.ink} />
      </AnimatedG>
      <SpineMouth expression={expression} ink={palette.ink} />
      {expression === 'sleepy' ? (
        <AnimatedG animatedProps={asleepProps}>
          <Path
            d="M80 26 H90 L80 36 H90"
            fill="none"
            stroke={palette.ink}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
          />
        </AnimatedG>
      ) : null}
    </Svg>
  );
}
