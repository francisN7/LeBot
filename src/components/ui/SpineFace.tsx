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

/** Rosto no sistema de coordenadas da lombada B (64×128). */
const EYE_Y = 80;
const EYE_R = 4.8;

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
 * Olhos no sistema de coordenadas da lombada B (64×128).
 * Ficam num grupo separado para a piscada poder animar só eles; em `happy` os
 * olhos abrem um pouco mais para o rosto não parecer apertado.
 */
export function SpineEyes({
  expression,
  ink,
}: {
  expression: SpineExpression;
  ink: string;
}) {
  const spread = expression === 'happy' ? 10 : 8;
  const left = 32 - spread;
  const right = 32 + spread;

  if (expression === 'sleepy') {
    return (
      <>
        <Path
          d={`M${left - 4.5} ${EYE_Y} H${left + 4.5}`}
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.2}
        />
        <Path
          d={`M${right - 4.5} ${EYE_Y} H${right + 4.5}`}
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
        <Path d={star(left, EYE_Y, 7)} fill={ink} />
        <Path d={star(right, EYE_Y, 7)} fill={ink} />
      </>
    );
  }

  if (expression === 'happy') {
    return (
      <>
        <Path
          d={`M${left - 6} ${EYE_Y} Q${left} ${EYE_Y - 7.5} ${left + 6} ${EYE_Y}`}
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.8}
        />
        <Path
          d={`M${right - 6} ${EYE_Y} Q${right} ${EYE_Y - 7.5} ${right + 6} ${EYE_Y}`}
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.8}
        />
      </>
    );
  }

  return (
    <>
      <Circle cx={left} cy={EYE_Y} fill={ink} r={EYE_R} />
      <Circle cx={right} cy={EYE_Y} fill={ink} r={EYE_R} />
    </>
  );
}

/** Boca no mesmo sistema de coordenadas dos olhos. */
export function SpineMouth({
  expression,
  ink,
}: {
  expression: SpineExpression;
  ink: string;
}) {
  if (expression === 'happy') {
    return (
      <Path
        d="M26 92 Q32 99 38 92"
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
        d="M28.5 93 Q32 95.5 35.5 93"
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
        d="M26 93 Q32 101 38 93"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={3.4}
      />
    );
  }

  return <Rect fill={ink} height={3.6} rx={1.8} width={8} x={28} y={92} />;
}

/**
 * Expressões com piscada (olhos redondos/arco). As demais já têm os olhos
 * fechados (`sleepy`) ou em estrela (`shine`) e ficam estáticas.
 */
export function blinks(expression: SpineExpression): boolean {
  return expression === 'neutral' || expression === 'happy';
}

/**
 * Piscada compartilhada: `1` = olhos abertos, `0` = piscando.
 *
 * A lombada usa a opacidade do overlay de olhos; o selo da capa anima o grupo
 * dentro do SVG. Só `happy`/`neutral` piscam — `sleepy` e `shine` já têm olhos
 * fechados/estrela.
 *
 * `active` (S12b) desliga o loop e deixa os olhos abertos: a grade pausa os
 * cards fora da tela e durante a rolagem. Atribuir `1` já cancela a animação em
 * curso — não é preciso desmontar a camada.
 */
export function useBlink(expression: SpineExpression, active = true) {
  const blink = useSharedValue(1);
  const canBlink = blinks(expression);

  useEffect(() => {
    if (!canBlink || !active) {
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
  }, [active, blink, canBlink]);

  return { blink, canBlink };
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
  const { blink } = useBlink(expression);

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
