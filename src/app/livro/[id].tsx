import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { BookDetailScreen } from '@/features/library';
import { createNavigationGuard } from '@/lib/navigation';

export default function BookDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [allowNavigation] = useState(() => createNavigationGuard());

  function go(action: () => void) {
    if (allowNavigation()) {
      action();
    }
  }

  return (
    <BookDetailScreen
      bookId={id}
      onBack={() => go(() => router.back())}
      onEdit={() =>
        go(() =>
          router.push({ pathname: '/livro/[id]/editar', params: { id } }),
        )
      }
    />
  );
}
