import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme';

type RatingStarsProps = {
  /** Nota de 1 a 5; 0 significa "sem nota". */
  value: number;
  /** Com `onChange` as estrelas viram botões; sem ele, só leitura. */
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  label?: string;
  testID?: string;
};

const stars = [1, 2, 3, 4, 5];

/** Estrelas da resenha: leitura no detalhe, toque no formulário. */
export function RatingStars({
  value,
  onChange,
  size = 'md',
  label = 'Nota',
  testID = 'estrelas',
}: RatingStarsProps) {
  const starSize = size === 'sm' ? 16 : 30;
  const starStyle = { fontSize: starSize, lineHeight: starSize + 6 };

  if (!onChange) {
    return (
      <View
        accessibilityLabel={`${label}: ${value} de 5 estrelas`}
        accessible
        className="flex-row gap-xs"
        testID={testID}
      >
        {stars.map((star) => (
          <AppText
            key={star}
            style={[
              starStyle,
              { color: star <= value ? colors.goldDeep : colors.navyMuted },
            ]}
          >
            ★
          </AppText>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row gap-xs" testID={testID}>
      {stars.map((star) => (
        <Pressable
          accessibilityLabel={`${star} de 5 estrelas`}
          accessibilityRole="button"
          accessibilityState={{ selected: star <= value }}
          hitSlop={6}
          key={star}
          onPress={() => onChange(star)}
          testID={`${testID}-${star}`}
        >
          <AppText
            style={[
              starStyle,
              { color: star <= value ? colors.goldDeep : colors.navyMuted },
            ]}
          >
            ★
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
