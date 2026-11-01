import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { ReviewFormScreen } from '@/features/reviews';
import { createNavigationGuard } from '@/lib/navigation';

export default function BookReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function goBack() {
    if (allowNavigation()) {
      router.back();
    }
  }

  return <ReviewFormScreen bookId={id} onCancel={goBack} onDone={goBack} />;
}
