/**
 * Rascunho da S11b: compara três formas de girar o tassel no Android.
 *
 * Rota temporária, só para a conferência no aparelho; sai no fim da sessão.
 *
 * 1. `G` + `rotation` animado — o código atual da lombada (esperado: parado).
 * 2. `G` + `matrix` animado — `matrix` é prop nativa do grupo.
 * 3. `Animated.View` em volta de um `Svg` só do tassel — transform de View.
 */

import { type ComponentType, type ReactNode, useEffect, useId } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { colors, radii, spacing } from '@/theme';

const BODY = { height: 126, width: 62, x: 1, y: 1 };
const GOLD_STOPS = [
  { offset: 0, color: '#FFE3A3' },
  { offset: 0.45, color: colors.gold },
  { offset: 1, color: '#D99A24' },
] as const;
const THREADS = [-3, -1.8, -0.6, 0.6, 1.8, 3];
const SWING = { peak: 7, hold: 520, back: 1200, settle: 420 } as const;

type Swing = { peak: number; hold: number; back: number; settle: number };

/** Rajada curta para a esquerda, retorno longo, overshoot pequeno e pausa. */
function useSwing({ peak, hold, back, settle }: Swing) {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(
      withSequence(
        withTiming(peak, {
          duration: 420,
          easing: Easing.out(Easing.cubic),
        }),
        withDelay(
          hold,
          withTiming(peak * -0.12, {
            duration: back,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        withTiming(0, { duration: settle, easing: Easing.inOut(Easing.quad) }),
        withDelay(600, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [angle, back, hold, peak, settle]);

  return angle;
}

function GoldGradient({ id }: { id: string }) {
  return (
    <LinearGradient id={id} x1="0" x2="1" y1="0" y2="0">
      {GOLD_STOPS.map((stop) => (
        <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
      ))}
    </LinearGradient>
  );
}

function Tassel({ goldId }: { goldId: string }) {
  return (
    <G>
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
    </G>
  );
}

function SpineBase() {
  return (
    <>
      <Rect
        fill={colors.teal}
        height={BODY.height}
        rx={6}
        stroke={colors.navy}
        strokeWidth={2}
        width={BODY.width}
        x={BODY.x}
        y={BODY.y}
      />
      <Rect fill={colors.cream} height={4} rx={1.2} width={56} x={4} y={7} />
      <Rect fill={colors.cream} height={4} rx={1.2} width={56} x={4} y={111} />
      <Rect
        fill={colors.navy}
        height={2.2}
        opacity={0.3}
        width={62}
        x={1}
        y={52}
      />
      <Rect
        fill={colors.navy}
        height={2.2}
        opacity={0.3}
        width={62}
        x={1}
        y={103}
      />
    </>
  );
}

type MatrixProps = { matrix: number[] };

const AnimatedGroup = Animated.createAnimatedComponent(G);

const AnimatedMatrixGroup = AnimatedGroup as unknown as ComponentType<{
  animatedProps?: Partial<MatrixProps>;
  children?: ReactNode;
}>;

function RotationTassel() {
  const angle = useSwing(SWING);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const goldId = `gold-rot-${uid}`;
  const animated = useAnimatedProps(() => ({ rotation: angle.value }));

  return (
    <View style={styles.stage}>
      <Svg
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 64 128"
        width="100%"
      >
        <Defs>
          <GoldGradient id={goldId} />
        </Defs>
        <SpineBase />
        <AnimatedGroup animatedProps={animated} origin="6, 0">
          <Tassel goldId={goldId} />
        </AnimatedGroup>
      </Svg>
    </View>
  );
}

function MatrixTassel() {
  const angle = useSwing(SWING);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const goldId = `gold-mat-${uid}`;
  const animated = useAnimatedProps<MatrixProps>(() => {
    const radians = (angle.value * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return {
      matrix: [cos, sin, -sin, cos, 6 * (1 - cos), -6 * sin],
    };
  });

  return (
    <View style={styles.stage}>
      <Svg
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 64 128"
        width="100%"
      >
        <Defs>
          <GoldGradient id={goldId} />
        </Defs>
        <SpineBase />
        <AnimatedMatrixGroup animatedProps={animated}>
          <Tassel goldId={goldId} />
        </AnimatedMatrixGroup>
      </Svg>
    </View>
  );
}

function ViewTassel() {
  const angle = useSwing(SWING);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const goldId = `gold-view-${uid}`;
  const motion = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  return (
    <View style={styles.stage}>
      <Svg
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 64 128"
        width="100%"
      >
        <SpineBase />
      </Svg>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.tasselOrigin, motion]}
      >
        <Svg
          height="100%"
          preserveAspectRatio="none"
          viewBox="0 0 64 128"
          width="100%"
        >
          <Defs>
            <GoldGradient id={goldId} />
          </Defs>
          <Tassel goldId={goldId} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Card({
  title,
  expected,
  children,
}: {
  title: string;
  expected: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText tone="muted" variant="caption">
        {expected}
      </AppText>
      {children}
    </View>
  );
}

export default function DevTasselRoute() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <AppText variant="title">Lab do tassel</AppText>
      <AppText tone="muted" variant="caption">
        Rascunho da S11b. Se só as opções 2 e 3 se moverem, o `rotation` animado
        no `G` é a causa. Se todas ficarem paradas, o problema é outro.
      </AppText>
      <Card
        expected="Código atual: rotation + origin no AnimatedG. Esperado: parado."
        title="1. G + rotation"
      >
        <RotationTassel />
      </Card>
      <Card
        expected="matrix (prop nativa do grupo) calculada no worklet. Esperado: anima."
        title="2. G + matrix"
      >
        <MatrixTassel />
      </Card>
      <Card
        expected="Animated.View com rotate e origem 6/64. Esperado: anima."
        title="3. View + SVG do tassel"
      >
        <ViewTassel />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.cream, flex: 1 },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  stage: {
    alignSelf: 'center',
    height: 128,
    marginTop: spacing.sm,
    width: 64,
  },
  tasselOrigin: { transformOrigin: '9.375% 0%' },
});
