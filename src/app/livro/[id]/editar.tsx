import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { BookFormScreen } from '@/features/library';
import { createNavigationGuard } from '@/lib/navigation';

export default function EditBookRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function goBack() {
    if (allowNavigation()) {
      router.back();
    }
  }

  return <BookFormScreen bookId={id} onCancel={goBack} onDone={goBack} />;
}
