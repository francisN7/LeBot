import { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Circle, G, Path, Rect } from 'react-native-svg';

import type { SpineExpression } from '@/features/library/spine-art';

const AnimatedG = Animated.createAnimatedComponent(G);

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

/**
 * Olhos no sistema de coordenadas da lombada estreita (52×128).
 * Ficam num grupo separado para a piscada poder animar só eles.
 */
function SpineEyes({
  expression,
  ink,
}: {
  expression: SpineExpression;
  ink: string;
}) {
  if (expression === 'sleepy') {
    return (
      <>
        <Path
          d="M12 56 H21"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.2}
        />
        <Path
          d="M26 56 H35"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.2}
        />
      </>
    );
  }

  if (expression === 'shine') {
    return (
      <>
        <Path d={star(16.5, 56, 6.5)} fill={ink} />
        <Path d={star(30.5, 56, 6.5)} fill={ink} />
      </>
    );
  }

  if (expression === 'happy') {
    return (
      <>
        <Path
          d="M11 56 Q16.5 49.5 22 56"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.6}
        />
        <Path
          d="M25 56 Q30.5 49.5 36 56"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.6}
        />
      </>
    );
  }

  return (
    <>
      <Circle cx={16.5} cy={56} fill={ink} r={4.4} />
      <Circle cx={30.5} cy={56} fill={ink} r={4.4} />
    </>
  );
}

/** Boca no mesmo sistema de coordenadas dos olhos. */
function SpineMouth({
  expression,
  ink,
}: {
  expression: SpineExpression;
  ink: string;
}) {
  if (expression === 'happy') {
    return (
      <Path
        d="M17.5 68 Q23.5 75 29.5 68"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={3.4}
      />
    );
  }

  if (expression === 'sleepy') {
    return (
      <Path
        d="M20 69 Q23.5 71.5 27 69"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={2.8}
      />
    );
  }

  if (expression === 'shine') {
    return (
      <Path
        d="M17.5 69 Q23.5 77 29.5 69"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={3.4}
      />
    );
  }

  return <Rect fill={ink} height={3.6} rx={1.8} width={8} x={19.5} y={68} />;
}

/**
 * Rosto completo do status, compartilhado pela lombada e pelo selo da capa.
 *
 * A piscada anima só a opacidade dos olhos (`happy`/`neutral`), porque `sleepy`
 * já fecha os olhos e `shine` tem estrelas; boca e acessórios ficam parados.
 * Usar o mesmo componente nos dois lugares impede as expressões de divergirem.
 */
export function SpineFace({
  expression,
  ink,
  testID,
}: {
  expression: SpineExpression;
  ink: string;
  testID?: string;
}) {
  const blink = useSharedValue(1);
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

  const eyesProps = useAnimatedProps(() => ({ opacity: blink.value }));

  return (
    <>
      <AnimatedG animatedProps={eyesProps} testID={testID}>
        <SpineEyes expression={expression} ink={ink} />
      </AnimatedG>
      <SpineMouth expression={expression} ink={ink} />
    </>
  );
}
