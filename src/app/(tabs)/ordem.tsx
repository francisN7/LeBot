import { useRouter } from 'expo-router';
import { useState } from 'react';

import { QueueScreen } from '@/features/queue';
import { createNavigationGuard } from '@/lib/navigation';

export default function OrdemRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  return (
    <QueueScreen
      onOpenBook={(id) => {
        if (!allowNavigation()) {
          return;
        }

        router.push({ pathname: '/livro/[id]', params: { id } });
      }}
    />
  );
}
