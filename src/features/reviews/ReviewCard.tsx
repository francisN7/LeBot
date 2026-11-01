import { View } from 'react-native';

import { AppText, Button, Card, RatingStars } from '@/components/ui';
import type { Review } from './types';
import { useReviewFields } from './use-reviews';

type ReviewCardProps = {
  review: Review;
  onEdit: () => void;
};

/** Resenha no detalhe: nota, texto, citação e só os extras preenchidos. */
export function ReviewCard({ review, onEdit }: ReviewCardProps) {
  const { fields } = useReviewFields();
  const filledExtras = fields.flatMap((field) => {
    const value = review.extras[field.id]?.trim();

    return value ? [{ id: field.id, name: field.name, value }] : [];
  });

  return (
    <Card className="gap-sm" testID="resenha-card">
      <View className="flex-row items-center justify-between gap-sm">
        <AppText variant="label">Resenha</AppText>
        <RatingStars
          label="Nota"
          size="sm"
          testID="resenha-nota"
          value={review.rating}
        />
      </View>

      {review.text ? (
        <AppText>{review.text}</AppText>
      ) : (
        <AppText tone="muted" variant="caption">
          Sem texto, só a nota.
        </AppText>
      )}

      {review.quote ? (
        <View className="border-l-4 border-pink pl-sm">
          <AppText style={{ fontStyle: 'italic' }}>{review.quote}</AppText>
        </View>
      ) : null}

      {filledExtras.map((extra) => (
        <View className="gap-xs" key={extra.id}>
          <AppText variant="label" tone="muted">
            {extra.name}
          </AppText>
          <AppText>{extra.value}</AppText>
        </View>
      ))}

      <Button
        label="Editar resenha"
        onPress={onEdit}
        size="sm"
        variant="secondary"
      />
    </Card>
  );
}
