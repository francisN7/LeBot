import { useRouter } from 'expo-router';
import { useState } from 'react';

import { EstanteScreen } from '@/features/library';
import { createNavigationGuard } from '@/lib/navigation';

export default function EstanteRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function go(action: () => void) {
    if (allowNavigation()) {
      action();
    }
  }

  return (
    <EstanteScreen
      onCreateBook={() => go(() => router.push('/livro/novo'))}
      onOpenBook={(id) =>
        go(() => router.push({ pathname: '/livro/[id]', params: { id } }))
      }
      onOpenStats={() => go(() => router.push('/estatisticas'))}
    />
  );
}
