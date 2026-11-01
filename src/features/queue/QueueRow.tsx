import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

import { AppText, BookArt, Card, Chip } from '@/components/ui';
import { labelForStatus, UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';
import { colors } from '@/theme';

const DRAG_THRESHOLD = 12;

type QueueRowProps = {
  book: Book;
  genreName: string;
  genreColor: string;
  position: number;
  isPrincipal: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  note: string | null;
  /** Deslocamento que abre o espaço do destino enquanto outra linha arrasta. */
  previewShift?: number;
  onOpen: () => void;
  onUp: () => void;
  onDown: () => void;
  /** Deslocamento vertical solto pelo arrastar; a tela decide a posição. */
  onDrop: (translationY: number) => void;
  onDragStart: () => void;
  onDragMove: (translationY: number) => void;
  onDragEnd: () => void;
  onHeight: (height: number) => void;
};

type RowActionProps = {
  symbol: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

const styles = StyleSheet.create({
  sheen: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.pink,
    opacity: 0.5,
  },
});

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
        'h-9 w-9 items-center justify-center rounded-full border-2 border-navy bg-surface active:opacity-80',
        disabled ? 'opacity-50' : null,
      )}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
    >
      <AppText variant="bodyStrong">{symbol}</AppText>
    </Pressable>
  );
}

/**
 * Linha da Ordem: abre o detalhe, sobe/desce pelas setas (acessível) ou arrasta
 * pela alça. A alça exige um toque longo para não brigar com a rolagem; a tela
 * trava o scroll enquanto o arrastar está ativo.
 */
export function QueueRow({
  book,
  genreName,
  genreColor,
  position,
  isPrincipal,
  canMoveUp,
  canMoveDown,
  note,
  previewShift = 0,
  onOpen,
  onUp,
  onDown,
  onDrop,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHeight,
}: QueueRowProps) {
  const translateY = useSharedValue(0);
  const preview = useSharedValue(0);
  const dragging = useSharedValue(false);
  const sheen = useSharedValue(-30);

  // Callbacks estáveis: a alça não é recriada quando a tela re-renderiza no
  // início do arrastar (o scroll é travado por estado).
  const dropRef = useRef(onDrop);
  const dragStartRef = useRef(onDragStart);
  const dragMoveRef = useRef(onDragMove);
  const dragEndRef = useRef(onDragEnd);
  dropRef.current = onDrop;
  dragStartRef.current = onDragStart;
  dragMoveRef.current = onDragMove;
  dragEndRef.current = onDragEnd;

  const handleDrop = useCallback((offset: number) => {
    dropRef.current(offset);
  }, []);
  const handleDragStart = useCallback(() => {
    dragStartRef.current();
  }, []);
  const handleDragMove = useCallback((offset: number) => {
    dragMoveRef.current(offset);
  }, []);
  const handleDragEnd = useCallback(() => {
    dragEndRef.current();
  }, []);

  useEffect(() => {
    preview.value = withTiming(previewShift, { duration: 140 });
  }, [preview, previewShift]);

  useEffect(() => {
    sheen.value = withRepeat(
      withSequence(
        withDelay(
          2200,
          withTiming(22, {
            duration: 700,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
        withTiming(-22, { duration: 0 }),
      ),
      -1,
    );
  }, [sheen]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(180)
        .onStart(() => {
          dragging.value = true;
          runOnJS(handleDragStart)();
        })
        .onUpdate((event) => {
          translateY.value = event.translationY;
          runOnJS(handleDragMove)(event.translationY);
        })
        .onEnd((event) => {
          const offset = event.translationY;
          translateY.value = 0;
          dragging.value = false;

          if (Math.abs(offset) >= DRAG_THRESHOLD) {
            runOnJS(handleDrop)(offset);
          }
        })
        .onFinalize(() => {
          translateY.value = 0;
          dragging.value = false;
          runOnJS(handleDragEnd)();
        }),
    [
      dragging,
      handleDragEnd,
      handleDragMove,
      handleDragStart,
      handleDrop,
      translateY,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    elevation: dragging.value ? 8 : 0,
    opacity: dragging.value ? 0.94 : 1,
    transform: [
      { translateY: translateY.value + preview.value },
      { scale: dragging.value ? 1.02 : 1 },
      { rotate: dragging.value ? '1.2deg' : '0deg' },
    ],
    zIndex: dragging.value ? 2 : 0,
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheen.value }, { rotate: '18deg' }],
  }));

  const chipLabel = isPrincipal
    ? 'Principal'
    : book.status === 'reading' || book.status === 'paused'
      ? labelForStatus(book.status)
      : null;

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
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
              {`${isPrincipal ? '♛ ' : ''}${position + 1}º na ordem`}
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
            {chipLabel ? (
              <Chip label={chipLabel} selected={isPrincipal} />
            ) : null}
            {book.status === 'paused' ? (
              <AppText tone="muted" variant="caption">
                fora do plano enquanto estiver pausado
              </AppText>
            ) : null}
          </View>
        </Pressable>

        <View className="w-20 self-stretch items-center justify-center">
          <View className="absolute top-0 left-0 right-0 items-center">
            <GestureDetector gesture={gesture}>
              <View
                accessibilityHint="Segure e arraste para reordenar. As setas também movem."
                accessibilityLabel={`Arrastar ${book.title}`}
                accessible
                className="h-5 w-9 items-center justify-center overflow-hidden"
                hitSlop={10}
              >
                <View className="gap-[3px]">
                  <View className="h-[2px] w-6 rounded-full bg-navy" />
                  <View className="h-[2px] w-6 rounded-full bg-navy" />
                  <View className="h-[2px] w-6 rounded-full bg-navy" />
                </View>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.sheen, sheenStyle]}
                />
              </View>
            </GestureDetector>
          </View>

          <View className="flex-row gap-xs">
            <RowAction
              disabled={!canMoveUp}
              label={`Subir ${book.title}`}
              onPress={onUp}
              symbol="↑"
            />
            <RowAction
              disabled={!canMoveDown}
              label={`Descer ${book.title}`}
              onPress={onDown}
              symbol="↓"
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
