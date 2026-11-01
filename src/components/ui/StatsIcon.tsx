import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/theme';

type StatsIconProps = {
  size?: number;
  color?: string;
  testID?: string;
};

/**
 * Três barras de livro de pé: o ícone discreto de "Meu ritmo" na Estante.
 * Decorativo — quem carrega o rótulo é o botão ao redor.
 */
export function StatsIcon({
  size = 16,
  color = colors.navyMuted,
  testID,
}: StatsIconProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      <Svg height={size} viewBox="0 0 24 24" width={size}>
        <Rect fill={color} height={8} rx={2} width={5} x={3} y={13} />
        <Rect fill={color} height={13} rx={2} width={5} x={10} y={8} />
        <Rect fill={color} height={18} rx={2} width={5} x={17} y={3} />
      </Svg>
    </View>
  );
}
