import { useRouter } from 'expo-router';

import { AjustesScreen } from '@/features/settings';

export default function AjustesRoute() {
  const router = useRouter();

  return (
    <AjustesScreen
      onOpenGenres={() => router.push('/generos')}
      // S11b: atalho temporário para o lab do tassel; sai no fim da sessão.
      onOpenTasselLab={() => router.push('/dev-tassel')}
    />
  );
}
