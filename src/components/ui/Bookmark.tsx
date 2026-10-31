import Svg, { Path } from 'react-native-svg';

import { colors, sizes } from '@/theme';

type BookmarkProps = {
  /** Cor do gênero; a mesma da lombada. */
  color: string;
  width?: number;
  height?: number;
};

/**
 * Fita de marca-página com entalhe em "V" na base, desenhada sobre a capa.
 * O desenho em SVG evita depender de bordas/cantos falsos no Android.
 */
export function Bookmark({
  color,
  width = sizes.bookmark.width,
  height = sizes.bookmark.height,
}: BookmarkProps) {
  return (
    <Svg
      accessibilityElementsHidden
      height={height}
      importantForAccessibility="no-hide-descendants"
      viewBox="0 0 18 28"
      width={width}
    >
      <Path
        d="M1 1 H17 V27 L9 20 L1 27 Z"
        fill={color}
        stroke={colors.navy}
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}
