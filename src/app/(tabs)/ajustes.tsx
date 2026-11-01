import { useRouter } from 'expo-router';

import { AjustesScreen } from '@/features/settings';

export default function AjustesRoute() {
  const router = useRouter();

  return <AjustesScreen onOpenGenres={() => router.push('/generos')} />;
}
