import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import { AjustesScreen } from '@/features/settings';
import { colors, radii } from '@/theme';

export default function AjustesRoute() {
  const router = useRouter();

  return (
    <>
      <AjustesScreen onOpenGenres={() => router.push('/generos')} />
      {/* S11b: atalho temporário para o lab do tassel; sai no fim da sessão. */}
      {__DEV__ ? (
        <Pressable
          onPress={() => router.push('/dev-tassel')}
          style={styles.lab}
        >
          <AppText tone="inverse" variant="label">
            Lab do tassel
          </AppText>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  lab: {
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
    right: 16,
  },
});
