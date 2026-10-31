import { Circle, Path, Rect } from 'react-native-svg';

import type { SpineExpression } from '@/features/library/spine-art';

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
 * Olhos da lombada no sistema de coordenadas do corpo (100×140).
 * Ficam num grupo separado para a piscada poder animar só eles.
 */
export function SpineEyes({
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
          d="M29 62 H39"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={4}
        />
        <Path
          d="M61 62 H71"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={4}
        />
      </>
    );
  }

  if (expression === 'shine') {
    return (
      <>
        <Path d={star(34, 62, 10)} fill={ink} />
        <Path d={star(66, 62, 10)} fill={ink} />
      </>
    );
  }

  if (expression === 'happy') {
    return (
      <>
        <Path
          d="M28 62 Q34 54 40 62"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={4.5}
        />
        <Path
          d="M60 62 Q66 54 72 62"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={4.5}
        />
      </>
    );
  }

  return (
    <>
      <Circle cx={34} cy={62} fill={ink} r={6} />
      <Circle cx={66} cy={62} fill={ink} r={6} />
    </>
  );
}

/** Boca da lombada no mesmo sistema de coordenadas dos olhos. */
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
        d="M42 74 Q50 82 58 74"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={4}
      />
    );
  }

  if (expression === 'sleepy') {
    return (
      <Path
        d="M46 76 Q50 79 54 76"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={3.5}
      />
    );
  }

  if (expression === 'shine') {
    return (
      <Path
        d="M42 76 Q50 86 58 76"
        fill="none"
        stroke={ink}
        strokeLinecap="round"
        strokeWidth={4}
      />
    );
  }

  return <Rect fill={ink} height={5} rx={2.5} width={12} x={44} y={76} />;
}

/** Rosto completo, usado no selo de status sobre a capa. */
export function SpineFace({
  expression,
  ink,
}: {
  expression: SpineExpression;
  ink: string;
}) {
  return (
    <>
      <SpineEyes expression={expression} ink={ink} />
      <SpineMouth expression={expression} ink={ink} />
    </>
  );
}
