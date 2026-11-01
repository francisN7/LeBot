import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui';
import { colors } from '@/theme';

import { labelForStatus } from './genre';
import {
  OPTION_HEIGHT,
  OPTION_WIDTH,
  type Point,
  statusAngles,
  statusWheelOrder,
  WHEEL_HALF_EXTENT,
  WHEEL_RADIUS,
} from './status-wheel-geometry';
import type { ReadingStatus } from './types';

/** Tempo da animação de saída; o pai desmonta um pouco depois. */
export const WHEEL_CLOSE_MS = 180;
const CLOSE_UNMOUNT_MS = WHEEL_CLOSE_MS + 30;

type StatusWheelOverlayProps = {
  anchor: Point;
  preview: ReadingStatus;
  closing: boolean;
  onSelect: (status: ReadingStatus) => void;
  onCancel: () => void;
  onClosed: () => void;
};

function WheelOption({
  status,
  selected,
  progress,
  onSelect,
}: {
  status: ReadingStatus;
  selected: boolean;
  progress: SharedValue<number>;
  onSelect: (status: ReadingStatus) => void;
}) {
  const radians = (statusAngles[status] * Math.PI) / 180;
  const emphasis = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    emphasis.value = withSpring(selected ? 1 : 0, {
      damping: 14,
      stiffness: 240,
    });
  }, [emphasis, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateX: Math.cos(radians) * WHEEL_RADIUS * progress.value,
      },
      {
        translateY: Math.sin(radians) * WHEEL_RADIUS * progress.value,
      },
      {
        scale: (0.7 + 0.3 * progress.value) * (1 + 0.08 * emphasis.value),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.option, animatedStyle]}>
      <Pressable
        accessibilityLabel={labelForStatus(status)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={twMerge(
          'h-full items-center justify-center rounded-pill border-2 border-navy px-sm active:opacity-80',
          selected ? 'bg-navy' : 'bg-cream',
        )}
        onPress={() => onSelect(status)}
        testID={`status-wheel-${status}`}
      >
        <AppText
          numberOfLines={1}
          tone={selected ? 'inverse' : 'default'}
          variant="label"
        >
          {labelForStatus(status)}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Roda radial flutuante. Fica na mesma janela da tela (sem Modal) para o
 * gesto de arraste continuar vivo; o pai renderiza sobre a Estante e controla
 * a prévia. As opções aparecem/somem do centro com mola.
 */
export function StatusWheelOverlay({
  anchor,
  preview,
  closing,
  onSelect,
  onCancel,
  onClosed,
}: StatusWheelOverlayProps) {
  const progress = useSharedValue(0);
  const onClosedRef = useRef(onClosed);

  useEffect(() => {
    progress.value = withSpring(1, {
      damping: 17,
      stiffness: 210,
      mass: 0.75,
    });
  }, [progress]);

  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    if (!closing) {
      return;
    }

    progress.value = withTiming(0, {
      duration: WHEEL_CLOSE_MS,
      easing: Easing.in(Easing.quad),
    });
    const timer = setTimeout(() => {
      onClosedRef.current();
    }, CLOSE_UNMOUNT_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [closing, progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.22,
    transform: [{ scale: progress.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.15,
  }));

  return (
    <View
      accessibilityViewIsModal
      style={StyleSheet.absoluteFill}
      testID="status-wheel-layer"
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, backdropStyle]}
      />
      <Pressable
        accessibilityLabel="Fechar troca de status"
        accessibilityRole="button"
        style={StyleSheet.absoluteFill}
        onPress={onCancel}
        testID="status-wheel-backdrop"
      />

      <View
        accessibilityLabel="Roda de status"
        pointerEvents="box-none"
        style={[
          styles.wheel,
          {
            left: anchor.x - WHEEL_HALF_EXTENT,
            top: anchor.y - WHEEL_HALF_EXTENT,
          },
        ]}
        testID="status-wheel"
      >
        <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />

        {statusWheelOrder.map((status) => (
          <WheelOption
            key={status}
            onSelect={onSelect}
            progress={progress}
            selected={status === preview}
            status={status}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.navy,
  },
  wheel: {
    position: 'absolute',
    width: WHEEL_HALF_EXTENT * 2,
    height: WHEEL_HALF_EXTENT * 2,
    overflow: 'visible',
  },
  ring: {
    position: 'absolute',
    left: WHEEL_HALF_EXTENT - WHEEL_RADIUS,
    top: WHEEL_HALF_EXTENT - WHEEL_RADIUS,
    width: WHEEL_RADIUS * 2,
    height: WHEEL_RADIUS * 2,
    borderRadius: WHEEL_RADIUS,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  option: {
    position: 'absolute',
    left: WHEEL_HALF_EXTENT - OPTION_WIDTH / 2,
    top: WHEEL_HALF_EXTENT - OPTION_HEIGHT / 2,
    width: OPTION_WIDTH,
    height: OPTION_HEIGHT,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
});
