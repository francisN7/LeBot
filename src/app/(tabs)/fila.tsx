import { useRouter } from 'expo-router';
import { useState } from 'react';

import { FilaScreen } from '@/features/queue';
import { createNavigationGuard } from '@/lib/navigation';

export default function FilaRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  return (
    <FilaScreen
      onOpenBook={(id) => {
        if (!allowNavigation()) {
          return;
        }

        router.push({ pathname: '/livro/[id]', params: { id } });
      }}
    />
  );
}
