import { type ComponentType, type ReactNode, useEffect, useId } from 'react';
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
  ClipPath,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
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

type MatrixProps = { matrix: number[] };

/**
 * `matrix` é prop nativa do grupo, mas não está no tipo do `G`. O cast existe
 * para o Reanimated escrever a matriz direto no nativo, sem passar pelo render.
 */
const AnimatedMatrixG = Animated.createAnimatedComponent(
  G,
) as unknown as ComponentType<{
  animatedProps?: Partial<MatrixProps>;
  children?: ReactNode;
}>;

/** Sistema de coordenadas da lombada B (64×128, 1:2). */
const VIEW = { height: 128, width: 64 };
/** O corpo encurta 4 px para a sombra de contato caber no slot. */
const BODY = { height: 126, width: 62, x: 1, y: 1 };
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

/** Ponta do tassel: 22 unidades abaixo da fixação, com o balanço em graus. */
const TASSEL = {
  body: 10,
  bodyHesitation: 9.4,
  bodyRelease: 9.8,
  bodyOvershoot: -1.6,
  bodySettle: -1.2,
  fringe: 12.5,
  fringeHesitation: 11.6,
  fringeRelease: 12.3,
  fringeOvershoot: -2.8,
  fringeSettle: -2.2,
  shadow: 5.5,
  shadowOvershoot: -1,
  /** Ciclo único, em ms: ataque rápido, hesitação, retorno lento e pausa. */
  cycle: 4400,
} as const;

const THREADS = [-3, -1.8, -0.6, 0.6, 1.8, 3];

/**
 * Matriz coluna-maior de rotação em graus em torno de (ox, oy). É a mesma que
 * o `G` calcula no render — animar `matrix` (prop nativa) evita o
 * `rotation`/`origin`, que o lado nativo ignora.
 */
function rotationMatrix(angle: number, ox: number, oy: number): number[] {
  'worklet';
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return [
    cos,
    sin,
    -sin,
    cos,
    ox * (1 - cos) + oy * sin,
    -ox * sin + oy * (1 - cos),
  ];
}

/** A corda sai do topo e encontra o corpo; o clip a corta na silhueta. */
function TasselCord() {
  return (
    <>
      <Path
        d="M6 0 V4.6"
        stroke="#B87A12"
        strokeLinecap="round"
        strokeWidth={1.5}
      />
      <Path
        d="M6 0 V4.6"
        stroke="#FFE3A3"
        strokeLinecap="round"
        strokeWidth={0.6}
      />
    </>
  );
}

/** Corpo e pescoço do tassel, abaixo da corda. */
function TasselHead({ goldId }: { goldId: string }) {
  return (
    <>
      <Rect
        fill={`url(#${goldId})`}
        height={3.2}
        rx={1.6}
        stroke="#B87A12"
        strokeWidth={0.5}
        width={4.4}
        x={3.8}
        y={4.4}
      />
      <Path
        d="M4.6 5.4 V6.8"
        opacity={0.8}
        stroke="#FFE3A3"
        strokeLinecap="round"
        strokeWidth={0.7}
      />
      <Rect
        fill="#D99A24"
        height={1.6}
        rx={0.8}
        stroke="#B87A12"
        strokeWidth={0.4}
        width={5.6}
        x={3.2}
        y={7.4}
      />
    </>
  );
}

/** Franja de seis fios; gira em torno do pescoço (6, 9). */
function TasselFringe() {
  return (
    <>
      {THREADS.map((dx, index) => {
        const x0 = 6 + dx * 0.28;
        const x1 = 6 + dx;
        const y1 = 22 + (index % 2) * 1.2;

        return (
          <G key={dx}>
            <Path
              d={`M${x0} 9 L${x1} ${y1}`}
              stroke="#B87A12"
              strokeLinecap="round"
              strokeWidth={1.3}
            />
            <Path
              d={`M${x0} 9 L${x1} ${y1}`}
              stroke="#FFD98A"
              strokeLinecap="round"
              strokeWidth={0.65}
            />
          </G>
        );
      })}
    </>
  );
}

/** Ciclo do corpo: ataque, hesitação curta, retorno com overshoot e pausa. */
function bodySwing() {
  return withRepeat(
    withSequence(
      withTiming(TASSEL.body, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(TASSEL.bodyHesitation, {
        duration: 560,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.body, {
        duration: 340,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.bodyRelease, {
        duration: 340,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.bodyOvershoot, {
        duration: 880,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.bodySettle, {
        duration: 440,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      withDelay(920, withTiming(0, { duration: 0 })),
    ),
    -1,
    false,
  );
}

/** A franja chega ~90 ms depois do corpo e passa um pouco do ângulo. */
function fringeSwing() {
  return withRepeat(
    withSequence(
      withDelay(
        90,
        withTiming(TASSEL.fringe, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        }),
      ),
      withTiming(TASSEL.fringeHesitation, {
        duration: 570,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.fringeRelease, {
        duration: 700,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.fringeOvershoot, {
        duration: 880,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(TASSEL.fringeSettle, {
        duration: 440,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(0, { duration: 530, easing: Easing.inOut(Easing.quad) }),
      withDelay(790, withTiming(0, { duration: 0 })),
    ),
    -1,
    false,
  );
}

/** A sombra acompanha o corpo com 55% do ângulo, atrasada ~40 ms. */
function shadowSwing() {
  return withRepeat(
    withSequence(
      withDelay(
        40,
        withTiming(TASSEL.shadow, {
          duration: 440,
          easing: Easing.out(Easing.cubic),
        }),
      ),
      withDelay(
        660,
        withTiming(TASSEL.shadowOvershoot, {
          duration: 1540,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      withTiming(0, { duration: 528, easing: Easing.inOut(Easing.quad) }),
      withDelay(1192, withTiming(0, { duration: 0 })),
    ),
    -1,
    false,
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
  const body = useSharedValue(0);
  const fringe = useSharedValue(0);
  const shadow = useSharedValue(0);
  const rawId = useId();
  const gradientId = `spine-cyl-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clipId = `${gradientId}-clip`;
  const bodyClipId = `${gradientId}-body-clip`;
  const goldId = `${gradientId}-gold`;
  const shadowFilterId = `${gradientId}-tassel-shadow`;

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

  useEffect(() => {
    body.value = bodySwing();
    fringe.value = fringeSwing();
    shadow.value = shadowSwing();
  }, [body, fringe, shadow]);

  const sheenProps = useAnimatedProps(() => ({ x: sheen.value }));
  const zzzProps = useAnimatedProps(() => ({
    opacity: asleep.value,
    translateY: (1 - asleep.value) * -2,
  }));
  const bodyProps = useAnimatedProps<MatrixProps>(() => ({
    matrix: rotationMatrix(body.value, 6, 0),
  }));
  const headProps = useAnimatedProps<MatrixProps>(() => ({
    matrix: rotationMatrix(body.value, 6, 0),
  }));
  const fringeProps = useAnimatedProps<MatrixProps>(() => ({
    matrix: rotationMatrix(fringe.value, 6, 9),
  }));
  const shadowProps = useAnimatedProps<MatrixProps>(() => ({
    matrix: rotationMatrix(shadow.value, 6, 0),
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
        <ClipPath id={bodyClipId}>
          <Rect
            height={BODY.height}
            rx={6}
            width={BODY.width}
            x={BODY.x}
            y={BODY.y}
          />
        </ClipPath>
        <LinearGradient id={goldId} x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor="#FFE3A3" />
          <Stop offset="0.45" stopColor={colors.gold} />
          <Stop offset="1" stopColor="#D99A24" />
        </LinearGradient>
        <Filter
          height="200%"
          id={shadowFilterId}
          width="200%"
          x="-50%"
          y="-50%"
        >
          <FeGaussianBlur stdDeviation={1.2} />
        </Filter>
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
        <AnimatedMatrixG animatedProps={shadowProps}>
          <Ellipse
            cx={7.6}
            cy={13}
            fill={colors.navy}
            filter={`url(#${shadowFilterId})`}
            opacity={0.22}
            rx={2.4}
            ry={8}
          />
        </AnimatedMatrixG>
        <G clipPath={`url(#${bodyClipId})`}>
          <AnimatedMatrixG animatedProps={bodyProps}>
            <TasselCord />
          </AnimatedMatrixG>
        </G>
        <AnimatedMatrixG animatedProps={headProps}>
          <TasselHead goldId={goldId} />
        </AnimatedMatrixG>
        <AnimatedMatrixG animatedProps={fringeProps}>
          <TasselFringe />
        </AnimatedMatrixG>
      </G>
    </Svg>
  );
}
