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

import {
  AppText,
  BookArt,
  Card,
  Chip,
  type ScreenScrollViewRef,
} from '@/components/ui';
import { labelForStatus, UNKNOWN_GENRE_NAME } from '@/features/library/genre';
import type { Book } from '@/features/library/types';
import { colors } from '@/theme';

const DRAG_THRESHOLD = 12;

/**
 * O RNGH aceita o ref do `ScrollView` em `blocksExternalGesture` (a doc usa
 * assim), mas o tipo público só cobre refs de gesto/componente.
 */
type ExternalGestureRef = Parameters<
  ReturnType<typeof Gesture.Pan>['blocksExternalGesture']
>[0];

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
  /** Desliga a transição de layout no commit do drop. */
  animateLayout?: boolean;
  /** Zera a prévia na hora, sem animação, no commit do drop. */
  instantPreview?: boolean;
  onOpen: () => void;
  onUp: () => void;
  onDown: () => void;
  /** Deslocamento vertical solto pelo arrastar; a tela decide a posição. */
  onDrop: (translationY: number) => void;
  onDragStart: () => void;
  onDragMove: (translationY: number) => void;
  onDragEnd: () => void;
  onHeight: (height: number) => void;
  /** ScrollView da tela; o pan bloqueia a rolagem nativa. */
  scrollRef: ScreenScrollViewRef;
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
  animateLayout = true,
  instantPreview = false,
  onOpen,
  onUp,
  onDown,
  onDrop,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHeight,
  scrollRef,
}: QueueRowProps) {
  const translateY = useSharedValue(0);
  const preview = useSharedValue(0);
  const dragging = useSharedValue(false);
  const dropped = useSharedValue(false);
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
    preview.value = instantPreview
      ? previewShift
      : withTiming(previewShift, { duration: 140 });
  }, [instantPreview, preview, previewShift]);

  // O drop só zera o deslocamento depois que a nova ordem entrou em vigor;
  // zerar antes faria a linha voltar para a posição antiga por um frame.
  useEffect(() => {
    if (!instantPreview) {
      return;
    }

    translateY.value = 0;
    dragging.value = false;
  }, [dragging, instantPreview, translateY]);

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
        .blocksExternalGesture(scrollRef as unknown as ExternalGestureRef)
        .onStart(() => {
          dragging.value = true;
          dropped.value = false;
          runOnJS(handleDragStart)();
        })
        .onUpdate((event) => {
          translateY.value = event.translationY;
          runOnJS(handleDragMove)(event.translationY);
        })
        .onEnd((event) => {
          const offset = event.translationY;

          if (Math.abs(offset) >= DRAG_THRESHOLD) {
            dropped.value = true;
            runOnJS(handleDrop)(offset);
          } else {
            translateY.value = 0;
          }
        })
        .onFinalize(() => {
          dragging.value = false;

          // Com drop, quem finaliza é o `handleDrop` (commit + fim do scroll
          // no mesmo lote). Sem drop, a linha volta e o estado é limpo aqui.
          if (!dropped.value) {
            translateY.value = 0;
            runOnJS(handleDragEnd)();
          }
        }),
    [
      dragging,
      dropped,
      handleDragEnd,
      handleDragMove,
      handleDragStart,
      handleDrop,
      scrollRef,
      translateY,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => {
    // No commit do drop a ordem já está na posição final: ignorar o
    // deslocamento evita a linha "voltar" por um frame antes de zerar.
    const lifted = dragging.value && !instantPreview;
    const offset = instantPreview ? 0 : translateY.value + preview.value;

    return {
      elevation: lifted ? 8 : 0,
      opacity: lifted ? 0.94 : 1,
      transform: [
        { translateY: offset },
        { scale: lifted ? 1.02 : 1 },
        { rotate: lifted ? '1.2deg' : '0deg' },
      ],
      zIndex: lifted ? 2 : 0,
    };
  });

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
      layout={LinearTransition.duration(animateLayout ? 220 : 0)}
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
