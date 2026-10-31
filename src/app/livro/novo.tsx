import { useRouter } from 'expo-router';

import { BookFormScreen } from '@/features/library';

export default function NewBookRoute() {
  const router = useRouter();

  return (
    <BookFormScreen
      onCancel={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
