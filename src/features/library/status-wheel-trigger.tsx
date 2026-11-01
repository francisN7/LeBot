import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Chip } from '@/components/ui';
import {
  type Area,
  clampWheelCenter,
  type Point,
  statusFromPointer,
} from './status-wheel-geometry';
import type { ReadingStatus } from './types';

type StatusWheelTriggerProps = {
  label: string;
  /** Área onde a roda flutua (a tela, medida pelo pai). */
  area: Area;
  onOpen: (anchor: Point) => void;
  /** `null` significa dedo no miolo: a prévia volta ao status original. */
  onPreview: (status: ReadingStatus | null) => void;
  /** `null` cancela sem gravar. */
  onSettle: (status: ReadingStatus | null) => void;
  testID?: string;
};

/**
 * Chip de status com o gesto da roda. O `Pan` só ativa depois de 500 ms
 * parado; a partir daí o mesmo toque é rastreado até soltar, mesmo fora do
 * chip. Toque simples e rolagem da estante continuam funcionando.
 */
export function StatusWheelTrigger({
  label,
  area,
  onOpen,
  onPreview,
  onSettle,
  testID,
}: StatusWheelTriggerProps) {
  const window = useWindowDimensions();
  const effectiveArea = area.width > 0 && area.height > 0 ? area : window;
  const areaRef = useRef<Area>(effectiveArea);
  const centerRef = useRef<Point | null>(null);
  const lastStatusRef = useRef<ReadingStatus | null>(null);
  const callbacks = useRef({ onOpen, onPreview, onSettle });

  useEffect(() => {
    areaRef.current = effectiveArea;
  }, [effectiveArea]);

  useEffect(() => {
    callbacks.current = { onOpen, onPreview, onSettle };
  }, [onOpen, onPreview, onSettle]);

  const handleOpen = useCallback((x: number, y: number) => {
    const center = clampWheelCenter({ x, y }, areaRef.current);

    centerRef.current = center;
    lastStatusRef.current = null;
    callbacks.current.onPreview(null);
    callbacks.current.onOpen(center);
  }, []);

  const handleMove = useCallback((x: number, y: number) => {
    if (!centerRef.current) {
      return;
    }

    const next = statusFromPointer({ x, y }, centerRef.current);

    if (next !== lastStatusRef.current) {
      lastStatusRef.current = next;
      callbacks.current.onPreview(next);
    }
  }, []);

  const handleEnd = useCallback(() => {
    const status = lastStatusRef.current;

    centerRef.current = null;
    lastStatusRef.current = null;
    callbacks.current.onSettle(status);
  }, []);

  const handleCancel = useCallback(() => {
    centerRef.current = null;
    lastStatusRef.current = null;
    callbacks.current.onSettle(null);
  }, []);

  const openAccessible = useCallback(() => {
    const currentArea = areaRef.current;
    const center = clampWheelCenter(
      { x: currentArea.width / 2, y: currentArea.height / 2 },
      currentArea,
    );

    callbacks.current.onPreview(null);
    callbacks.current.onOpen(center);
  }, []);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(500)
        .withTestId(testID ? `gesture-${testID}` : 'status-wheel-gesture')
        .onStart((event) => {
          runOnJS(handleOpen)(event.absoluteX, event.absoluteY);
        })
        .onUpdate((event) => {
          runOnJS(handleMove)(event.absoluteX, event.absoluteY);
        })
        .onFinalize((_event, success) => {
          if (success) {
            runOnJS(handleEnd)();
          } else {
            runOnJS(handleCancel)();
          }
        }),
    [handleCancel, handleEnd, handleMove, handleOpen, testID],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View>
        <Chip
          accessibilityActions={[
            { name: 'openStatusWheel', label: 'Trocar status' },
          ]}
          accessibilityHint="Segure e arraste para trocar o status"
          label={label}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'openStatusWheel') {
              openAccessible();
            }
          }}
          testID={testID}
        />
      </View>
    </GestureDetector>
  );
}
