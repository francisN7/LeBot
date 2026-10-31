import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/** Estados do LêBot definidos em `docs/brand.md`. */
export type MascotState =
  | 'neutral'
  | 'reading'
  | 'happy'
  | 'sleepy'
  | 'thinking'
  | 'celebrating';

/** Rótulo que o leitor de tela anuncia para cada estado. */
export const mascotLabel: Record<MascotState, string> = {
  neutral: 'LêBot, o robô leitor',
  reading: 'LêBot lendo um livro',
  happy: 'LêBot feliz',
  sleepy: 'LêBot sonolento',
  thinking: 'LêBot pensando',
  celebrating: 'LêBot comemorando',
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Olhos redondos (piscam); nos outros estados o olho é estático. */
const BLINKING_STATES: MascotState[] = ['neutral', 'reading', 'thinking'];

const EYE_RADIUS = 9;
const VIEWBOX = { width: 120, height: 130 };

function star(cx: number, cy: number, radius: number): string {
  const waist = radius * 0.3;

  return [
    `M${cx} ${cy - radius}`,
    `L${cx + waist} ${cy - waist}`,
    `L${cx + radius} ${cy}`,
    `L${cx + waist} ${cy + waist}`,
    `L${cx} ${cy + radius}`,
    `L${cx - waist} ${cy + waist}`,
    `L${cx - radius} ${cy}`,
    `L${cx - waist} ${cy - waist}`,
    'Z',
  ].join(' ');
}

function Eyes({ state }: { state: MascotState }) {
  if (state === 'sleepy') {
    return (
      <>
        <Path
          d="M38 58 H54"
          stroke={colors.gold}
          strokeLinecap="round"
          strokeWidth={4}
        />
        <Path
          d="M66 58 H82"
          stroke={colors.gold}
          strokeLinecap="round"
          strokeWidth={4}
        />
      </>
    );
  }

  if (state === 'happy' || state === 'celebrating') {
    return (
      <>
        <Path d={star(46, 58, 11)} fill={colors.gold} />
        <Path d={star(74, 58, 11)} fill={colors.gold} />
      </>
    );
  }

  return (
    <>
      <Circle cx={46} cy={58} fill={colors.gold} r={EYE_RADIUS} />
      <Circle cx={74} cy={58} fill={colors.gold} r={EYE_RADIUS} />
      <Circle cx={42} cy={54} fill={colors.cream} r={2.5} />
      <Circle cx={70} cy={54} fill={colors.cream} r={2.5} />
    </>
  );
}

function Mouth({ state }: { state: MascotState }) {
  if (state === 'happy') {
    return (
      <Path
        d="M52 72 Q60 80 68 72"
        fill="none"
        stroke={colors.gold}
        strokeLinecap="round"
        strokeWidth={3.5}
      />
    );
  }

  if (state === 'celebrating') {
    return <Ellipse cx={60} cy={74} fill={colors.gold} rx={7} ry={5} />;
  }

  return <Ellipse cx={60} cy={73} fill={colors.goldDeep} rx={5} ry={3.5} />;
}

function Accessories({ state }: { state: MascotState }) {
  if (state === 'sleepy') {
    return (
      <G>
        <Path
          d="M96 20 H108 L96 32 H108"
          fill="none"
          stroke={colors.navyMuted}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </G>
    );
  }

  if (state === 'thinking') {
    return (
      <G>
        <Circle
          cx={100}
          cy={28}
          fill={colors.cream}
          r={6}
          stroke={colors.navy}
          strokeWidth={2}
        />
        <Circle
          cx={110}
          cy={17}
          fill={colors.cream}
          r={4}
          stroke={colors.navy}
          strokeWidth={2}
        />
        <Circle cx={116} cy={8} fill={colors.cream} r={2.5} />
      </G>
    );
  }

  if (state === 'celebrating') {
    return (
      <G>
        <Rect
          fill={colors.pink}
          height={6}
          rx={1.5}
          transform="rotate(-20 20 24)"
          width={4}
          x={18}
          y={21}
        />
        <Rect
          fill={colors.teal}
          height={6}
          rx={1.5}
          transform="rotate(25 100 40)"
          width={4}
          x={98}
          y={37}
        />
        <Path
          d={star(24, 62, 6)}
          fill={colors.gold}
          transform="rotate(15 24 62)"
        />
        <Path d={star(104, 84, 5)} fill={colors.coral} />
      </G>
    );
  }

  return null;
}

type MascotProps = {
  state?: MascotState;
  /** Largura em px; a altura segue a proporção do desenho. */
  size?: number;
  /** Sobrescreve o rótulo padrão do estado. */
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Mascote LêBot em SVG, com os seis estados da marca.
 *
 * A animação é discreta: respiração contínua e piscada nos estados de olhos
 * redondos. Não é um rig 3D — o desenho é o mesmo, muda olho, boca e acessório.
 */
export function Mascot({
  state = 'neutral',
  size = 120,
  accessibilityLabel,
  testID,
}: MascotProps) {
  const breath = useSharedValue(1);
  const eyeRadius = useSharedValue(EYE_RADIUS);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breath]);

  useEffect(() => {
    if (!BLINKING_STATES.includes(state)) {
      eyeRadius.value = EYE_RADIUS;
      return;
    }

    eyeRadius.value = withRepeat(
      withSequence(
        withTiming(EYE_RADIUS, { duration: 2600 }),
        withTiming(1.4, { duration: 90 }),
        withTiming(EYE_RADIUS, { duration: 90 }),
      ),
      -1,
    );
  }, [eyeRadius, state]);

  const breathing = useAnimatedStyle(() => ({
    transform: [
      { scale: breath.value },
      { translateY: -(breath.value - 1) * 50 },
    ],
  }));

  const blinking = useAnimatedProps(() => ({ r: eyeRadius.value }));

  return (
    <Animated.View style={breathing}>
      <View
        accessibilityLabel={accessibilityLabel ?? mascotLabel[state]}
        accessibilityRole="image"
        testID={testID}
      >
        <Svg
          accessibilityElementsHidden
          height={(size * VIEWBOX.height) / VIEWBOX.width}
          importantForAccessibility="no-hide-descendants"
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          width={size}
        >
          <Path
            d="M60 18 V30"
            stroke={colors.navy}
            strokeLinecap="round"
            strokeWidth={5}
          />
          <Circle cx={60} cy={12} fill={colors.coral} r={7} />
          <Rect fill={colors.navy} height={22} rx={5} width={10} x={8} y={52} />
          <Rect
            fill={colors.navy}
            height={22}
            rx={5}
            width={10}
            x={102}
            y={52}
          />
          <Rect
            fill={colors.cream}
            height={58}
            rx={20}
            stroke={colors.navy}
            strokeWidth={3}
            width={84}
            x={18}
            y={32}
          />
          <Rect
            fill={colors.navy}
            height={38}
            rx={14}
            width={60}
            x={30}
            y={42}
          />
          {BLINKING_STATES.includes(state) ? (
            <>
              <AnimatedCircle
                animatedProps={blinking}
                cx={46}
                cy={58}
                fill={colors.gold}
              />
              <AnimatedCircle
                animatedProps={blinking}
                cx={74}
                cy={58}
                fill={colors.gold}
              />
              <Circle cx={42} cy={54} fill={colors.cream} r={2.5} />
              <Circle cx={70} cy={54} fill={colors.cream} r={2.5} />
            </>
          ) : (
            <Eyes state={state} />
          )}
          <Mouth state={state} />
          <Rect
            fill={colors.gold}
            height={26}
            rx={7}
            width={60}
            x={30}
            y={94}
          />
          <Rect
            fill={colors.cream}
            height={18}
            rx={3}
            width={52}
            x={34}
            y={98}
          />
          <Path d="M60 98 V116" stroke={colors.goldDeep} strokeWidth={2} />
          <Path
            d="M40 103 H52 M40 108 H52 M68 103 H80 M68 108 H80"
            stroke={colors.navyMuted}
            strokeLinecap="round"
            strokeWidth={2}
          />
          <Accessories state={state} />
        </Svg>
      </View>
    </Animated.View>
  );
}
