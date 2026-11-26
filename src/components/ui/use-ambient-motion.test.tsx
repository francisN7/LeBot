import { act, render, screen } from '@testing-library/react-native';
import { NavigationContext } from 'expo-router/react-navigation';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';

import { useAmbientMotion } from './use-ambient-motion';

let mockReducedMotion = false;

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: () => mockReducedMotion,
}));

type FocusEvent = 'focus' | 'blur';
type Navigation = ComponentProps<typeof NavigationContext.Provider>['value'];

/** Navegação mínima: só o que o gate lê (foco e eventos de foco). */
function fakeNavigation(initiallyFocused: boolean) {
  let focused = initiallyFocused;
  const listeners: Record<FocusEvent, Set<() => void>> = {
    focus: new Set(),
    blur: new Set(),
  };

  const navigation = {
    isFocused: () => focused,
    addListener: (type: FocusEvent, callback: () => void) => {
      listeners[type].add(callback);
      return () => listeners[type].delete(callback);
    },
  };

  return {
    navigation: navigation as unknown as Navigation,
    emit(type: FocusEvent) {
      focused = type === 'focus';
      for (const callback of listeners[type]) {
        callback();
      }
    },
    listenerCount: () => listeners.focus.size + listeners.blur.size,
  };
}

function Probe({ requested }: { requested?: boolean }) {
  return <Text>{useAmbientMotion(requested) ? 'anima' : 'parado'}</Text>;
}

describe('useAmbientMotion', () => {
  afterEach(() => {
    mockReducedMotion = false;
  });

  it('anima fora de uma rota (testes e previews)', async () => {
    await render(<Probe />);

    expect(screen.getByText('anima')).toBeOnTheScreen();
  });

  it('respeita o pedido do componente', async () => {
    await render(<Probe requested={false} />);

    expect(screen.getByText('parado')).toBeOnTheScreen();
  });

  it('para quando a tela perde o foco e volta ao recuperar', async () => {
    const fake = fakeNavigation(true);

    await render(
      <NavigationContext.Provider value={fake.navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );
    expect(screen.getByText('anima')).toBeOnTheScreen();

    await act(async () => fake.emit('blur'));
    expect(screen.getByText('parado')).toBeOnTheScreen();

    await act(async () => fake.emit('focus'));
    expect(screen.getByText('anima')).toBeOnTheScreen();
  });

  it('não anima numa tela montada sem foco (aba escondida)', async () => {
    const fake = fakeNavigation(false);

    await render(
      <NavigationContext.Provider value={fake.navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );

    expect(screen.getByText('parado')).toBeOnTheScreen();
  });

  it('solta os ouvintes de foco ao desmontar', async () => {
    const fake = fakeNavigation(true);

    const view = await render(
      <NavigationContext.Provider value={fake.navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );
    expect(fake.listenerCount()).toBe(2);

    await view.unmount();
    expect(fake.listenerCount()).toBe(0);
  });

  it('não anima com "reduzir movimento" ligado, mesmo em foco', async () => {
    mockReducedMotion = true;
    const fake = fakeNavigation(true);

    await render(
      <NavigationContext.Provider value={fake.navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );

    expect(screen.getByText('parado')).toBeOnTheScreen();
  });
});
