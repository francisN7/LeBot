import { useRouter } from 'expo-router';
import { useState } from 'react';

import { GenresScreen } from '@/features/genres';
import { createNavigationGuard } from '@/lib/navigation';

export default function GenresRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function go(action: () => void) {
    if (allowNavigation()) {
      action();
    }
  }

  return (
    <GenresScreen
      onBack={() => go(() => router.back())}
      onCreate={() => go(() => router.push('/generos/novo'))}
      onOpenGenre={(id) =>
        go(() =>
          router.push({ pathname: '/generos/[id]/editar', params: { id } }),
        )
      }
    />
  );
}
