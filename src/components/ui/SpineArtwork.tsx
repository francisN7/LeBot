import { memo, useEffect, useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
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
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type {
  SpineExpression,
  SpinePalette,
} from '@/features/library/spine-art';
import { colors } from '@/theme';

import { SpineEyes, SpineMouth, useBlink } from './SpineFace';

/** Sistema de coordenadas da lombada B (64×128, 1:2). */
const VIEW = { height: 128, width: 64 };
/** O corpo encurta 4 px para a sombra de contato caber no slot. */
const BODY = { height: 126, width: 62, x: 1, y: 1 };
/** Posições das listras do headband/tailband. */
const HEADBAND_STRIPES = [5, 11, 17, 23, 29, 35, 41, 47, 53];
/** Paradas do gradiente da frente. */
const GRADIENT_STOPS = [0, 0.18, 0.5, 1] as const;

/**
 * Recortes das camadas animadas. Ficam no mesmo sistema 64×128 do corpo, então
 * cada overlay se alinha ao desenho por porcentagem — sem medir o layout.
 */
type Box = { height: number; width: number; x: number; y: number };

/** Tassel inteiro, com folga para a franja cruzar a borda ao girar. */
const TASSEL_BOX: Box = { height: 28, width: 16, x: -4, y: 0 };
/** Olhos da piscada: arco (`happy`) ou círculos (`neutral`). */
const EYES_BOX: Box = { height: 18, width: 34, x: 15, y: 69 };
/** Três “z” em diagonal no canto direito. */
const ZZZ_BOX: Box = { height: 24, width: 21, x: 43, y: 54 };

/** Ângulo do tassel em torno de (6, 0); a franja gira em (6, 9). */
const TASSEL_ORIGIN = { x: 6, y: 0 };
const FRINGE_ORIGIN = { x: 6, y: 9 };

type SpineArtworkProps = {
  expression: SpineExpression;
  palette: SpinePalette;
  /** Origem do giro do tassel em px: a arte escala com a lombada. */
  width?: number;
  height?: number;
  testID?: string;
};

function percent(value: number, total: number): `${number}%` {
  return `${(value / total) * 100}%` as `${number}%`;
}

function boxStyle(box: Box): ViewStyle {
  return {
    height: percent(box.height, VIEW.height),
    left: percent(box.x, VIEW.width),
    position: 'absolute',
    top: percent(box.y, VIEW.height),
    width: percent(box.width, VIEW.width),
  };
}

const TASSEL_LAYER = boxStyle(TASSEL_BOX);
const EYES_LAYER = boxStyle(EYES_BOX);
const ZZZ_LAYER = boxStyle(ZZZ_BOX);

function zPath(cx: number, cy: number, size: number): string {
  const half = size / 2;

  return `M${cx - half} ${cy - half} H${cx + half} L${cx - half} ${cy + half} H${cx + half}`;
}

/**
 * Ponta do tassel: 22 unidades abaixo da fixação, com o balanço em graus.
 * A corda começa em `y=2.1`: o clip antigo escondia acima de ~1,08, então o
 * comprimento visível é o mesmo e o topo continua preso ao corpo.
 */
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

/** A corda sai do corpo e encontra o pescoço; sem clip, começa dentro da capa. */
function TasselCord() {
  return (
    <>
      <Path
        d="M6 2.1 V4.6"
        stroke="#B87A12"
        strokeLinecap="round"
        strokeWidth={1.5}
      />
      <Path
        d="M6 2.1 V4.6"
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
 * **Camadas:** o corpo, as faixas e as nervuras ficam num SVG estático; o
 * brilho, a piscada, o "zzz" e o tassel são Views absolutas com `Svg` pequeno.
 * Só a camada que anima é invalidada por frame — antes cada matriz do tassel
 * redesenhava a lombada inteira (S11c).
 *
 * A etiqueta com o título é uma View do `Spine` (texto real e centralizado),
 * não texto dentro do SVG. O viewBox é 64×128; o compacto 52×104 mantém a
 * proporção exata, sem esticar o rosto.
 */
function SpineArtworkBase({
  expression,
  palette,
  width = VIEW.width,
  height = VIEW.height,
  testID,
}: SpineArtworkProps) {
  const sheen = useSharedValue(-20);
  const asleep = useSharedValue(1);
  const body = useSharedValue(0);
  const fringe = useSharedValue(0);
  const shadow = useSharedValue(0);
  const { blink, canBlink } = useBlink(expression);
  const rawId = useId();
  const baseId = `spine-cyl-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const clipId = `${baseId}-clip`;
  const shadeId = `${baseId}-shade`;
  const goldId = `${baseId}-gold`;
  const shadowId = `${baseId}-tassel-shadow`;

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

  const sheenMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: (sheen.value / VIEW.width) * width }],
  }));
  const eyesMotion = useAnimatedStyle(() => ({ opacity: blink.value }));
  const zzzMotion = useAnimatedStyle(() => ({ opacity: asleep.value }));
  const bodyMotion = useAnimatedStyle(() => ({
    transform: [{ rotate: `${body.value}deg` }],
  }));
  const fringeMotion = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fringe.value}deg` }],
  }));
  const shadowMotion = useAnimatedStyle(() => ({
    transform: [{ rotate: `${shadow.value}deg` }],
  }));

  // `transformOrigin` é medido da borda da própria camada; o recorte do tassel
  // começa em x=-4, então a origem (6, 0) fica a 10 unidades da esquerda.
  const originX = ((TASSEL_ORIGIN.x - TASSEL_BOX.x) * width) / VIEW.width;
  const fringeOriginY =
    ((FRINGE_ORIGIN.y - TASSEL_BOX.y) * height) / VIEW.height;
  const tasselOrigin: [number, number] = [originX, 0];
  const fringeOrigin: [number, number] = [originX, fringeOriginY];

  const glossClip = {
    ...boxStyle(BODY),
    borderRadius: (6 * width) / VIEW.width,
    overflow: 'hidden' as const,
  };
  const glossBar = {
    backgroundColor: palette.highlight,
    height: (138 * height) / VIEW.height,
    left: 0,
    opacity: expression === 'shine' ? 0.38 : 0.2,
    position: 'absolute' as const,
    top: (-10 * height) / VIEW.height,
    width: (9 * width) / VIEW.width,
  };

  const tasselViewBox = `${TASSEL_BOX.x} ${TASSEL_BOX.y} ${TASSEL_BOX.width} ${TASSEL_BOX.height}`;
  const eyesViewBox = `${EYES_BOX.x} ${EYES_BOX.y} ${EYES_BOX.width} ${EYES_BOX.height}`;
  const zzzViewBox = `${ZZZ_BOX.x} ${ZZZ_BOX.y} ${ZZZ_BOX.width} ${ZZZ_BOX.height}`;

  const zzz = [
    { cx: 49, cy: 73, size: 3.4, width: 1.4 },
    { cx: 53, cy: 67, size: 4.4, width: 1.7 },
    { cx: 57, cy: 60, size: 5.4, width: 2 },
  ];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {/* Corpo estático: gradiente, faixas, nervuras. Nunca anima. */}
      <Svg
        height="100%"
        preserveAspectRatio="none"
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        width="100%"
      >
        <Defs>
          <LinearGradient id={baseId} x1="0" x2="1" y1="0" y2="0">
            {GRADIENT_STOPS.map((offset, index) => (
              <Stop
                key={offset}
                offset={offset}
                stopColor={palette.gradient[index]}
              />
            ))}
          </LinearGradient>
          <LinearGradient id={shadeId} x1="0" x2="0" y1="0" y2="1">
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
          fill={`url(#${baseId})`}
          height={BODY.height}
          rx={6}
          stroke={colors.navy}
          strokeWidth={2}
          width={BODY.width}
          x={BODY.x}
          y={BODY.y}
        />
        <Rect
          fill={`url(#${shadeId})`}
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
        </G>
      </Svg>

      {/* Brilho: uma View recortada no corpo; só o transform anima. */}
      <View style={glossClip}>
        <Animated.View style={[glossBar, sheenMotion]} />
      </View>

      {/* Rosto: boca e olhos estáticos; a piscada é um overlay de opacidade. */}
      <View
        style={StyleSheet.absoluteFill}
        testID={testID ? `${testID}-face-${expression}` : undefined}
      >
        <Svg
          height="100%"
          preserveAspectRatio="none"
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          width="100%"
        >
          {canBlink ? null : (
            <SpineEyes expression={expression} ink={palette.ink} />
          )}
          <SpineMouth expression={expression} ink={palette.ink} />
        </Svg>

        {canBlink ? (
          <Animated.View style={[EYES_LAYER, eyesMotion]}>
            <Svg
              height="100%"
              preserveAspectRatio="none"
              viewBox={eyesViewBox}
              width="100%"
            >
              <SpineEyes expression={expression} ink={palette.ink} />
            </Svg>
          </Animated.View>
        ) : null}
      </View>

      {/* “zzz” do sono: SVG próprio, só a opacidade da View anima. */}
      {expression === 'sleepy' ? (
        <Animated.View
          style={[ZZZ_LAYER, zzzMotion]}
          testID={testID ? `${testID}-zzz` : undefined}
        >
          <Svg
            height="100%"
            preserveAspectRatio="none"
            viewBox={zzzViewBox}
            width="100%"
          >
            <G
              fill="none"
              stroke={palette.ink}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {zzz.map((item) => (
                <Path
                  d={zPath(item.cx, item.cy, item.size)}
                  key={item.size}
                  strokeWidth={item.width}
                />
              ))}
            </G>
          </Svg>
        </Animated.View>
      ) : null}

      {/*
        Tassel em três Views independentes, cada uma girada por `transform`.
        O SVG de cada camada é pequeno e estático; o giro não redesenha o corpo.
      */}
      <View
        style={StyleSheet.absoluteFill}
        testID={testID ? `${testID}-tassel` : undefined}
      >
        <Animated.View
          style={[
            TASSEL_LAYER,
            { transformOrigin: tasselOrigin },
            shadowMotion,
          ]}
        >
          <Svg
            height="100%"
            preserveAspectRatio="none"
            viewBox={tasselViewBox}
            width="100%"
          >
            <Defs>
              {/* Sombra radial em vez de FeGaussianBlur: sem bitmap por frame. */}
              <RadialGradient cx="0.5" cy="0.5" id={shadowId} r="0.5">
                <Stop offset="0" stopColor={colors.navy} stopOpacity={0.3} />
                <Stop offset="0.55" stopColor={colors.navy} stopOpacity={0.2} />
                <Stop offset="1" stopColor={colors.navy} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={7.6}
              cy={13}
              fill={`url(#${shadowId})`}
              rx={4}
              ry={9.6}
            />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[TASSEL_LAYER, { transformOrigin: tasselOrigin }, bodyMotion]}
        >
          <Svg
            height="100%"
            preserveAspectRatio="none"
            viewBox={tasselViewBox}
            width="100%"
          >
            <Defs>
              <LinearGradient id={goldId} x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0" stopColor="#FFE3A3" />
                <Stop offset="0.45" stopColor={colors.gold} />
                <Stop offset="1" stopColor="#D99A24" />
              </LinearGradient>
            </Defs>
            <TasselCord />
            <TasselHead goldId={goldId} />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            TASSEL_LAYER,
            { transformOrigin: fringeOrigin },
            fringeMotion,
          ]}
        >
          <Svg
            height="100%"
            preserveAspectRatio="none"
            viewBox={tasselViewBox}
            width="100%"
          >
            <TasselFringe />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * `memo`: a arte só redesenha quando expressão/paleta/tamanho mudam. O preview
 * do status na grade re-renderiza o card, mas não o corpo estático.
 */
export const SpineArtwork = memo(SpineArtworkBase);
