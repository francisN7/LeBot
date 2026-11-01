import { useRouter } from 'expo-router';
import { useState } from 'react';

import { TimelineScreen } from '@/features/stats';
import { createNavigationGuard } from '@/lib/navigation';

export default function TimelineRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function go(action: () => void) {
    if (allowNavigation()) {
      action();
    }
  }

  return <TimelineScreen onBack={() => go(() => router.back())} />;
}
