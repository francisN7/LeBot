import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type {
  SpineExpression,
  SpinePalette,
} from '@/features/library/spine-art';

/** Raio do corpo no viewBox 100×140; acompanha `radii.md` na proporção. */
const ART_RADIUS = 14;

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

/** Corpo com canto direito arredondado, onde entra a faixa de sombra. */
const BODY_PATH = `M0 ${ART_RADIUS} Q0 0 ${ART_RADIUS} 0 H${100 - ART_RADIUS} Q100 0 100 ${ART_RADIUS} V${140 - ART_RADIUS} Q100 140 ${100 - ART_RADIUS} 140 H${ART_RADIUS} Q0 140 0 ${140 - ART_RADIUS} Z`;

const SHADE_PATH = `M76 0 H86 Q100 0 100 ${ART_RADIUS} V${140 - ART_RADIUS} Q100 140 86 140 H76 Z`;

function Face({
  expression,
  ink,
}: {
  expression: SpineExpression;
  ink: string;
}) {
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
        <Path
          d="M42 74 Q50 82 58 74"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={4}
        />
      </>
    );
  }

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
        <Path
          d="M46 76 Q50 79 54 76"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={3.5}
        />
        <Path
          d="M80 26 H90 L80 36 H90"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      </>
    );
  }

  if (expression === 'shine') {
    return (
      <>
        <Path d={star(34, 62, 10)} fill={ink} />
        <Path d={star(66, 62, 10)} fill={ink} />
        <Path
          d="M42 76 Q50 86 58 76"
          fill="none"
          stroke={ink}
          strokeLinecap="round"
          strokeWidth={4}
        />
      </>
    );
  }

  return (
    <>
      <Circle cx={34} cy={62} fill={ink} r={6} />
      <Circle cx={66} cy={62} fill={ink} r={6} />
      <Rect fill={ink} height={5} rx={2.5} width={12} x={44} y={76} />
    </>
  );
}

type SpineArtworkProps = {
  expression: SpineExpression;
  palette: SpinePalette;
  testID?: string;
};

/**
 * Desenho da lombada 3D: corpo na cor do gênero, faixa de sombra à direita,
 * brilho à esquerda, faixas superior/inferior e o rosto do status.
 *
 * O viewBox é fixo (100×140) e escala junto com a lombada; por isso o mesmo
 * desenho serve ao tamanho cheio e ao compacto da Fila.
 */
export function SpineArtwork({
  expression,
  palette,
  testID,
}: SpineArtworkProps) {
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
      <Face expression={expression} ink={palette.ink} />
    </Svg>
  );
}
