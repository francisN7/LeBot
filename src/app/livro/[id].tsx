import { useLocalSearchParams, useRouter } from 'expo-router';

import { BookDetailScreen } from '@/features/library';

export default function BookDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <BookDetailScreen
      bookId={id}
      onBack={() => router.back()}
      onEdit={() =>
        router.push({ pathname: '/livro/[id]/editar', params: { id } })
      }
    />
  );
}
