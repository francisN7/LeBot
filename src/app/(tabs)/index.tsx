import { useRouter } from 'expo-router';

import { EstanteScreen } from '@/features/library';

export default function EstanteRoute() {
  const router = useRouter();

  return (
    <EstanteScreen
      onCreateBook={() => router.push('/livro/novo')}
      onOpenBook={(id) =>
        router.push({ pathname: '/livro/[id]', params: { id } })
      }
    />
  );
}
