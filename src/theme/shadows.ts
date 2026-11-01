import type { ViewStyle } from 'react-native';

import { colors } from './colors';

/**
 * Sombra curta de contato: apoia a lombada/capa sobre o card sem mudar o
 * layout. É o mesmo vocabulário nos dois objetos, então eles parecem estar no
 * mesmo plano.
 */
export const contactShadow: ViewStyle = {
  elevation: 2,
  shadowColor: colors.navy,
  shadowOffset: { height: 2, width: 0 },
  shadowOpacity: 0.16,
  shadowRadius: 3,
};
