import { useEffect, useId } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import type {
  SpineExpression,
  SpinePalette,
} from '@/features/library/spine-art';

import { SpineFace } from './SpineFace';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Sistema de coordenadas da lombada estreita (52×128, 1:2,46). */
const VIEW = { height: 128, width: 52 };
/** Largura da frente; os 5 px restantes são a face lateral (~9,6%). */
const FRONT_WIDTH = 47;
const ART_RADIUS = 8;
/** O corpo ocupa o slot inteiro; o contorno acompanha o raio do Pressable. */
const BODY_PATH = `M0 ${ART_RADIUS} Q0 0 ${ART_RADIUS} 0 H${VIEW.width - 4} Q${VIEW.width} 0 ${VIEW.width} 4 V${VIEW.height - 4} Q${VIEW.width} ${VIEW.height} ${VIEW.width - 4} ${VIEW.height} H${ART_RADIUS} Q0 ${VIEW.height} 0 ${VIEW.height - ART_RADIUS} Z`;
/** Frente: canto esquerdo arredondado e aresta reta na charneira. */
const FRONT_PATH = `M0 ${ART_RADIUS} Q0 0 ${ART_RADIUS} 0 H${FRONT_WIDTH} V${VIEW.height} H${ART_RADIUS} Q0 ${VIEW.height} 0 ${VIEW.height - ART_RADIUS} Z`;
/** Paradas do gradiente da frente (objectBoundingBox). */
const GRADIENT_OFFSETS = [0, 0.16, 0.55, 1] as const;
/** Fita do tassel, com a ponta em V pendurada no rodapé. */
const TASSEL_PATH = 'M21.3 112 H25.7 V122 L23.5 127 L21.3 122 Z';

type SpineArtworkProps = {
  expression: SpineExpression;
  palette: SpinePalette;
  testID?: string;
};

/**
 * Desenho da lombada com volume: frente em gradiente, face lateral estreita,
 * vinco à esquerda, faixas de topo/base e tassel na base.
 *
 * O desenho foi feito para o formato 52×128 (compacto 42×104). A vida vem de
 * três animações discretas no UI thread: piscada (compartilhada com o selo da
 * capa), brilho que atravessa a frente, "z" pulsando no sono e o tassel
 * balançando de leve. O toque continua no `Pressable` do `Spine`; o SVG é
 * decorativo e não intercepta eventos.
 */
export function SpineArtwork({
  expression,
  palette,
  testID,
}: SpineArtworkProps) {
  const sheen = useSharedValue(-20);
  const asleep = useSharedValue(1);
  const swing = useSharedValue(-1);
  const rawId = useId();
  const gradientId = `spine-front-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clipId = `${gradientId}-clip`;

  useEffect(() => {
    sheen.value = -20;
    sheen.value = withRepeat(
      withSequence(
        withDelay(
          1800,
          withTiming(60, {
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        withTiming(-20, { duration: 0 }),
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

  useEffect(() => {
    swing.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [swing]);

  const sheenProps = useAnimatedProps(() => ({ x: sheen.value }));
  const asleepProps = useAnimatedProps(() => ({ opacity: asleep.value }));
  const tasselProps = useAnimatedProps(() => ({ rotation: swing.value * 2.8 }));

  return (
    <Svg
      accessibilityElementsHidden
      height="100%"
      importantForAccessibility="no-hide-descendants"
      preserveAspectRatio="none"
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      width="100%"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          {palette.gradient.map((color, index) => (
            <Stop
              key={`${GRADIENT_OFFSETS[index]}-${color}`}
              offset={GRADIENT_OFFSETS[index]}
              stopColor={color}
            />
          ))}
        </LinearGradient>
        <ClipPath id={clipId}>
          <Path d={FRONT_PATH} />
        </ClipPath>
      </Defs>

      {/* Lateral: o corpo inteiro na cor da face e a frente por cima. */}
      <Path d={BODY_PATH} fill={palette.side} />
      <Path d={FRONT_PATH} fill={`url(#${gradientId})`} />
      <Path
        d={`M${FRONT_WIDTH} 0 V${VIEW.height}`}
        opacity={0.55}
        stroke={palette.edge}
        strokeWidth={1}
      />
      <Path
        d="M4 7 V121"
        opacity={0.6}
        stroke={palette.edge}
        strokeLinecap="round"
        strokeWidth={1.4}
      />

      {/* Faixas de topo/base morrem na lateral, sugerindo a perspectiva. */}
      <Path
        d="M7 15 H44 L50 17"
        opacity={0.9}
        stroke={palette.highlight}
        strokeLinecap="round"
        strokeWidth={5}
      />
      <Path
        d="M7 113 H44 L50 111"
        opacity={0.9}
        stroke={palette.highlight}
        strokeLinecap="round"
        strokeWidth={5}
      />

      <G clipPath={`url(#${clipId})`}>
        <AnimatedRect
          animatedProps={sheenProps}
          fill={palette.highlight}
          height={148}
          opacity={expression === 'shine' ? 0.38 : 0.2}
          width={9}
          y={-10}
        />
      </G>

      <SpineFace
        expression={expression}
        ink={palette.ink}
        testID={testID ? `${testID}-face-${expression}` : undefined}
      />

      {expression === 'sleepy' ? (
        <AnimatedG animatedProps={asleepProps}>
          <Path
            d="M36 22 H43 L36 32 H43"
            fill="none"
            stroke={palette.ink}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.4}
          />
        </AnimatedG>
      ) : null}

      <AnimatedG
        animatedProps={tasselProps}
        origin="23.5, 112"
        testID={testID ? `${testID}-tassel` : undefined}
      >
        <Path d={TASSEL_PATH} fill={palette.accent} />
        <Circle cx={23.5} cy={113} fill={palette.accent} r={2} />
      </AnimatedG>
    </Svg>
  );
}
