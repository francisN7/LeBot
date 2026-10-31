import { useRouter } from 'expo-router';
import { useState } from 'react';

import { BookFormScreen } from '@/features/library';
import { createNavigationGuard } from '@/lib/navigation';

export default function NewBookRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  return (
    <BookFormScreen
      onCancel={() => {
        if (allowNavigation()) {
          router.back();
        }
      }}
      onDone={() => {
        if (allowNavigation()) {
          router.back();
        }
      }}
    />
  );
}
