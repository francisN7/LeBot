import { useRouter } from 'expo-router';
import { useState } from 'react';

import { GenreFormScreen } from '@/features/genres';
import { createNavigationGuard } from '@/lib/navigation';

export default function NewGenreRoute() {
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function goBack() {
    if (allowNavigation()) {
      router.back();
    }
  }

  return <GenreFormScreen onCancel={goBack} onDone={goBack} />;
}
