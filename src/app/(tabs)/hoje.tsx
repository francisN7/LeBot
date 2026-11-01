import { useRouter } from 'expo-router';
import { useState } from 'react';

import { HojeScreen } from '@/features/today';
import { createNavigationGuard } from '@/lib/navigation';

export default function HojeRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  return (
    <HojeScreen
      onOpenQueue={() => {
        if (allowNavigation()) {
          router.push('/ordem');
        }
      }}
    />
  );
}
