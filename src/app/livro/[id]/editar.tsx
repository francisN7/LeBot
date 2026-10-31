import { useLocalSearchParams, useRouter } from 'expo-router';

import { BookFormScreen } from '@/features/library';

export default function EditBookRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <BookFormScreen
      bookId={id}
      onCancel={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
