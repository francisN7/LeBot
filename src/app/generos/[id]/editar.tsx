import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { GenreFormScreen } from '@/features/genres';
import { createNavigationGuard } from '@/lib/navigation';

export default function EditGenreRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function goBack() {
    if (allowNavigation()) {
      router.back();
    }
  }

  return <GenreFormScreen genreId={id} onCancel={goBack} onDone={goBack} />;
}
