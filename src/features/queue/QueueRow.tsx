import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

import { AppText, BookArt, Card, Chip } from '@/components/ui';
import { labelForStatus, UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';

const DRAG_THRESHOLD = 12;

type QueueRowProps = {
  book: Book;
  genreName: string;
  genreColor: string;
  position: number;
  total: number;
  note: string | null;
  onOpen: () => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  /** Deslocamento vertical solto pelo arrastar; a tela decide a posição. */
  onDrop: (translationY: number) => void;
  onHeight: (height: number) => void;
};

type RowActionProps = {
  symbol: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

function RowAction({
  symbol,
  label,
  disabled = false,
  onPress,
}: RowActionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={twMerge(
        'h-7 w-7 items-center justify-center rounded-full border-2 border-navy bg-surface active:opacity-80',
        disabled ? 'opacity-50' : null,
      )}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
    >
      <AppText variant="label">{symbol}</AppText>
    </Pressable>
  );
}

/**
 * Linha da Ordem: abre o detalhe, sobe/desce pelas setas (acessível) ou
 * arrasta pela alça. O arrastar só entrega o deslocamento; a tela calcula a
 * posição final com as alturas medidas.
 */
export function QueueRow({
  book,
  genreName,
  genreColor,
  position,
  total,
  note,
  onOpen,
  onUp,
  onDown,
  onRemove,
  onDrop,
  onHeight,
}: QueueRowProps) {
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const gesture = Gesture.Pan()
    .activeOffsetY([-DRAG_THRESHOLD, DRAG_THRESHOLD])
    .onStart(() => {
      dragging.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const offset = event.translationY;
      translateY.value = 0;
      dragging.value = false;

      if (Math.abs(offset) >= DRAG_THRESHOLD) {
        runOnJS(onDrop)(offset);
      }
    })
    .onFinalize(() => {
      translateY.value = 0;
      dragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: dragging.value ? 0.92 : 1,
    transform: [{ translateY: translateY.value }],
    zIndex: dragging.value ? 2 : 0,
  }));

  const chipLabel =
    book.status === 'reading' || book.status === 'paused'
      ? labelForStatus(book.status)
      : null;

  return (
    <Animated.View
      onLayout={(event) => onHeight(event.nativeEvent.layout.height)}
      style={animatedStyle}
    >
      <Card
        className="flex-row items-center gap-md"
        testID={`queue-item-${book.id}`}
      >
        <Pressable
          accessibilityLabel={`Abrir ${book.title}`}
          accessibilityRole="button"
          className="flex-1 flex-row items-center gap-md active:opacity-80"
          onPress={onOpen}
        >
          <BookArt book={book} genreColor={genreColor} />
          <View className="flex-1 gap-xs">
            <AppText variant="caption" tone="muted">
              {`${position + 1}º na ordem`}
            </AppText>
            <AppText numberOfLines={1} variant="bodyStrong">
              {book.title}
            </AppText>
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {`${book.author} · ${genreName || UNKNOWN_GENRE_NAME}`}
            </AppText>
            {note ? (
              <AppText numberOfLines={1} variant="caption">
                {note}
              </AppText>
            ) : null}
            {chipLabel ? <Chip label={chipLabel} /> : null}
            {book.status === 'paused' ? (
              <AppText tone="muted" variant="caption">
                fora do plano enquanto estiver pausado
              </AppText>
            ) : null}
          </View>
        </Pressable>

        <View className="gap-xs">
          <View className="flex-row gap-xs">
            <RowAction
              disabled={position === 0}
              label={`Subir ${book.title}`}
              onPress={onUp}
              symbol="↑"
            />
            <RowAction
              disabled={position >= total - 1}
              label={`Descer ${book.title}`}
              onPress={onDown}
              symbol="↓"
            />
          </View>
          <View className="flex-row gap-xs">
            <RowAction
              label={`Remover ${book.title} da ordem`}
              onPress={onRemove}
              symbol="✕"
            />
            <GestureDetector gesture={gesture}>
              <View
                accessibilityHint="Use as setas para mover"
                accessibilityLabel={`Arrastar ${book.title}`}
                accessible
                className="h-7 w-7 items-center justify-center rounded-full border-2 border-navy bg-cream"
                hitSlop={8}
              >
                <AppText variant="label">⠿</AppText>
              </View>
            </GestureDetector>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
