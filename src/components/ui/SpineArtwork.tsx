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
  Ellipse,
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
import { colors } from '@/theme';

import { SpineFace } from './SpineFace';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** Sistema de coordenadas da lombada B (64×128, 1:2). */
const VIEW = { height: 128, width: 64 };
/** O corpo encurta 4 px para a sombra de contato caber no slot. */
const BODY = { height: 126, width: 62, x: 1, y: 1 };
const TASSEL_X = 5.8;
/** Posições das listras do headband/tailband. */
const HEADBAND_STRIPES = [5, 11, 17, 23, 29, 35, 41, 47, 53];
/** Paradas do gradiente da frente. */
const GRADIENT_STOPS = [0, 0.18, 0.5, 1] as const;

type SpineArtworkProps = {
  expression: SpineExpression;
  palette: SpinePalette;
  testID?: string;
};

function zPath(cx: number, cy: number, size: number): string {
  const half = size / 2;

  return `M${cx - half} ${cy - half} H${cx + half} L${cx - half} ${cy + half} H${cx + half}`;
}

/**
 * Tassel T1 no canto superior esquerdo: argola na borda, corda, corpo, pescoço
 * e franja de seis fios. A argola é cortada pelo topo do SVG para parecer que
 * sai de dentro do livro; o resto pende sobre o headband.
 */
function Tassel() {
  const threads = [-3, -1.8, -0.6, 0.6, 1.8, 3].map((dx, index) => {
    const x0 = TASSEL_X + dx * 0.35;
    const x1 = TASSEL_X + dx;
    const y1 = 22 + (index % 2) * 1.2;

    return (
      <G key={dx}>
        <Path
          d={`M${x0} 9.2 L${x1} ${y1}`}
          stroke={colors.navy}
          strokeLinecap="round"
          strokeWidth={1.5}
        />
        <Path
          d={`M${x0} 9.2 L${x1} ${y1}`}
          stroke={colors.gold}
          strokeLinecap="round"
          strokeWidth={0.75}
        />
      </G>
    );
  });

  return (
    <G stroke={colors.navy} strokeLinejoin="round" strokeWidth={0.7}>
      <Ellipse
        cx={TASSEL_X}
        cy={1.4}
        fill={colors.navy}
        opacity={0.18}
        rx={3.4}
        ry={2}
        stroke="none"
      />
      <Circle
        cx={TASSEL_X}
        cy={0.8}
        fill="none"
        r={1.4}
        stroke={colors.gold}
        strokeWidth={0.9}
      />
      <Path d={`M${TASSEL_X} 2 V5.2`} stroke={colors.gold} strokeWidth={1.2} />
      <Rect
        fill={colors.gold}
        height={3}
        rx={1.5}
        width={4}
        x={TASSEL_X - 2}
        y={5}
      />
      <Rect
        fill={colors.goldDeep}
        height={1.6}
        rx={0.8}
        width={5}
        x={TASSEL_X - 2.5}
        y={7.8}
      />
      {threads}
    </G>
  );
}

/**
 * Desenho da lombada B com volume: corpo cilíndrico, headband/tailband,
 * nervuras, rosto do status, "zzz" no sono e tassel no topo-esquerdo.
 *
 * A etiqueta com o título é uma View do `Spine` (texto real e centralizado),
 * não texto dentro do SVG. O viewBox é 64×128; o compacto 52×104 mantém a
 * proporção exata, sem esticar o rosto.
 */
export function SpineArtwork({
  expression,
  palette,
  testID,
}: SpineArtworkProps) {
  const sheen = useSharedValue(-20);
  const asleep = useSharedValue(1);
  const rawId = useId();
  const gradientId = `spine-cyl-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clipId = `${gradientId}-clip`;

  useEffect(() => {
    sheen.value = -20;
    sheen.value = withRepeat(
      withSequence(
        withDelay(
          1800,
          withTiming(64, {
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

  const sheenProps = useAnimatedProps(() => ({ x: sheen.value }));
  const zzzProps = useAnimatedProps(() => ({
    opacity: asleep.value,
    translateY: (1 - asleep.value) * -2,
  }));

  const zzz = [
    { cx: 49, cy: 73, size: 3.4, width: 1.4 },
    { cx: 53, cy: 67, size: 4.4, width: 1.7 },
    { cx: 57, cy: 60, size: 5.4, width: 2 },
  ];

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
          {GRADIENT_STOPS.map((offset, index) => (
            <Stop
              key={offset}
              offset={offset}
              stopColor={palette.gradient[index]}
            />
          ))}
        </LinearGradient>
        <LinearGradient id={`${clipId}-vert`} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={palette.shadow} stopOpacity={0.18} />
          <Stop offset="0.12" stopColor={palette.shadow} stopOpacity={0} />
          <Stop offset="0.88" stopColor={palette.shadow} stopOpacity={0} />
          <Stop offset="1" stopColor={palette.shadow} stopOpacity={0.26} />
        </LinearGradient>
        <ClipPath id={clipId}>
          <Rect
            height={BODY.height}
            rx={6}
            width={BODY.width}
            x={BODY.x}
            y={BODY.y}
          />
        </ClipPath>
      </Defs>

      <Rect
        fill={`url(#${gradientId})`}
        height={BODY.height}
        rx={6}
        stroke={colors.navy}
        strokeWidth={2}
        width={BODY.width}
        x={BODY.x}
        y={BODY.y}
      />
      <Rect
        fill={`url(#${clipId}-vert)`}
        height={BODY.height}
        rx={6}
        width={BODY.width}
        x={BODY.x}
        y={BODY.y}
      />

      <G clipPath={`url(#${clipId})`}>
        {/* Headband/tailband: faixas listradas nas duas pontas. */}
        {[7, 111].map((y) => (
          <G key={y}>
            <Rect
              fill={palette.highlight}
              height={4}
              rx={1.2}
              width={56}
              x={4}
              y={y}
            />
            {HEADBAND_STRIPES.map((x) => (
              <Rect
                fill={palette.ink}
                height={4}
                key={x}
                opacity={0.5}
                width={2.6}
                x={x}
                y={y}
              />
            ))}
            <Rect
              fill="none"
              height={4}
              rx={1.2}
              stroke={palette.edge}
              strokeWidth={0.5}
              width={56}
              x={4}
              y={y}
            />
          </G>
        ))}

        {/* Nervuras da capa dura. */}
        {[52, 103].map((y) => (
          <G key={y}>
            <Rect
              fill={palette.edge}
              height={2.2}
              opacity={0.6}
              width={62}
              x={1}
              y={y}
            />
            <Rect
              fill={palette.highlight}
              height={1}
              opacity={0.75}
              width={62}
              x={1}
              y={y + 2.2}
            />
          </G>
        ))}

        <AnimatedRect
          animatedProps={sheenProps}
          fill={palette.highlight}
          height={138}
          opacity={expression === 'shine' ? 0.38 : 0.2}
          width={9}
          y={-10}
        />

        <SpineFace
          expression={expression}
          ink={palette.ink}
          testID={testID ? `${testID}-face-${expression}` : undefined}
        />

        {expression === 'sleepy' ? (
          <AnimatedG
            animatedProps={zzzProps}
            fill="none"
            stroke={palette.ink}
            strokeLinecap="round"
            strokeLinejoin="round"
            testID={testID ? `${testID}-zzz` : undefined}
          >
            {zzz.map((item) => (
              <Path
                d={zPath(item.cx, item.cy, item.size)}
                key={item.size}
                strokeWidth={item.width}
              />
            ))}
          </AnimatedG>
        ) : null}
      </G>

      <G testID={testID ? `${testID}-tassel` : undefined}>
        <Tassel />
      </G>
    </Svg>
  );
}
