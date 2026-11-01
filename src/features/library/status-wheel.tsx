import { useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, radii } from '@/theme';

import { labelForStatus } from './genre';
import {
  offsetForStatus,
  statusFromOffset,
  statusWheelOrder,
} from './status-from-offset';
import type { ReadingStatus } from './types';

/** Altura de cada opção; a conta pura usa a mesma medida. */
export const STATUS_ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 3;

type StatusWheelProps = {
  /** Status em que a roda abre; mudanças de prévia não reposicionam a roda. */
  value: ReadingStatus;
  onPreview: (status: ReadingStatus) => void;
  onSettle: (status: ReadingStatus) => void;
  testID?: string;
};

/**
 * Roda vertical de status com snapping nativo. Deslizar só muda a prévia
 * (`onPreview`); soltar o dedo ou tocar numa opção confirma (`onSettle`). A
 * conta offset → status fica em `status-from-offset.ts` para ser testada sem
 * render.
 */
export function StatusWheel({
  value,
  onPreview,
  onSettle,
  testID,
}: StatusWheelProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const initialOffset = useRef(offsetForStatus(value, STATUS_ITEM_HEIGHT));
  const centeredRef = useRef(value);
  const settledRef = useRef(false);
  const [centered, setCentered] = useState(value);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: initialOffset.current,
      animated: false,
    });
  }, []);

  function preview(status: ReadingStatus) {
    if (centeredRef.current === status) {
      return;
    }

    centeredRef.current = status;
    setCentered(status);
    onPreview(status);
  }

  function settle(status: ReadingStatus) {
    if (settledRef.current) {
      return;
    }

    settledRef.current = true;
    preview(status);
    onSettle(status);
  }

  function settleFromEvent(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void {
    settle(
      statusFromOffset(event.nativeEvent.contentOffset.y, STATUS_ITEM_HEIGHT),
    );
  }

  function adjust(direction: 1 | -1) {
    const index = statusWheelOrder.indexOf(centeredRef.current);
    const nextIndex = Math.min(
      Math.max(index + direction, 0),
      statusWheelOrder.length - 1,
    );
    const next = statusWheelOrder[nextIndex];

    if (!next || next === centeredRef.current) {
      return;
    }

    settledRef.current = false;
    scrollRef.current?.scrollTo({
      y: offsetForStatus(next, STATUS_ITEM_HEIGHT),
      animated: true,
    });
    settle(next);
  }

  return (
    <View style={{ height: STATUS_ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <ScrollView
        accessibilityActions={[
          { name: 'increment', label: 'Próximo status' },
          { name: 'decrement', label: 'Status anterior' },
        ]}
        accessibilityLabel="Status de leitura"
        accessibilityRole="adjustable"
        accessibilityValue={{ text: labelForStatus(centered) }}
        contentContainerStyle={{ paddingVertical: STATUS_ITEM_HEIGHT }}
        decelerationRate="fast"
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') {
            adjust(1);
          } else if (event.nativeEvent.actionName === 'decrement') {
            adjust(-1);
          }
        }}
        onMomentumScrollEnd={settleFromEvent}
        onScroll={(event) => {
          preview(
            statusFromOffset(
              event.nativeEvent.contentOffset.y,
              STATUS_ITEM_HEIGHT,
            ),
          );
        }}
        onScrollBeginDrag={() => {
          settledRef.current = false;
        }}
        onScrollEndDrag={settleFromEvent}
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={STATUS_ITEM_HEIGHT}
        style={{ height: STATUS_ITEM_HEIGHT * VISIBLE_ITEMS }}
        testID={testID}
      >
        {statusWheelOrder.map((status) => {
          const isCentered = status === centered;

          return (
            <Pressable
              accessibilityLabel={labelForStatus(status)}
              accessibilityRole="button"
              key={status}
              onPress={() =>
                settle(
                  statusFromOffset(
                    offsetForStatus(status, STATUS_ITEM_HEIGHT),
                    STATUS_ITEM_HEIGHT,
                  ),
                )
              }
              style={{ height: STATUS_ITEM_HEIGHT }}
              className="items-center justify-center"
              testID={testID ? `${testID}-${status}` : undefined}
            >
              <AppText
                tone={isCentered ? 'default' : 'muted'}
                variant={isCentered ? 'title' : 'body'}
              >
                {labelForStatus(status)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: STATUS_ITEM_HEIGHT,
          left: 0,
          right: 0,
          height: STATUS_ITEM_HEIGHT,
          borderColor: colors.navy,
          borderRadius: radii.md,
          borderWidth: 2,
        }}
        testID={testID ? `${testID}-centro` : undefined}
      />
    </View>
  );
}
