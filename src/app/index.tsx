import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>S0</Text>
      </View>

      <Text style={styles.title}>LêBot</Text>
      <Text style={styles.tagline}>
        Sua estante, sua fila, seu plano do dia.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fundação no ar</Text>
        <Text style={styles.cardBody}>
          Este é o esqueleto do app. Biblioteca, fila de leitura e plano diário
          chegam nas próximas sessões.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.cream,
    gap: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.pinkSoft,
  },
  badgeText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.navy,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tagline: {
    color: colors.navy,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  card: {
    marginTop: 24,
    alignSelf: 'stretch',
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.navy,
    gap: 8,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.navy,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
