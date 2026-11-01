import { useRouter } from 'expo-router';
import { useState } from 'react';

import { StatsScreen } from '@/features/stats';
import { createNavigationGuard } from '@/lib/navigation';

export default function StatsRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function go(action: () => void) {
    if (allowNavigation()) {
      action();
    }
  }

  return (
    <StatsScreen
      onBack={() => go(() => router.back())}
      onGoToToday={() => go(() => router.replace('/hoje'))}
      onOpenBook={(id) =>
        go(() => router.push({ pathname: '/livro/[id]', params: { id } }))
      }
      onOpenTimeline={() => go(() => router.push('/linha-do-tempo'))}
    />
  );
}
