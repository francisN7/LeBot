import { NavigationContext } from 'expo-router/react-navigation';
import { useCallback, useContext, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

const noop = () => undefined;

/**
 * Foco da tela que contém o componente; `true` fora de uma rota (testes,
 * previews). O `useIsFocused` do Expo Router lança sem rota, por isso a leitura
 * é feita direto do `NavigationContext`.
 */
export function useScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!navigation) {
        return noop;
      }

      const offFocus = navigation.addListener('focus', onChange);
      const offBlur = navigation.addListener('blur', onChange);

      return () => {
        offFocus();
        offBlur();
      };
    },
    [navigation],
  );

  const getSnapshot = useCallback(
    () => navigation?.isFocused() ?? true,
    [navigation],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Pode rodar animação ambiente (respiração, piscada, brilho, balanço)?
 *
 * Regra da ADR 0029: só com a tela em foco e nunca com "reduzir movimento"
 * ligado no sistema. `requested` é o pedido do próprio componente (por exemplo,
 * a lombada visível e fora da rolagem).
 *
 * Mesmo liberada, a animação ambiente toca **uma vez** e para: quando o valor
 * volta a `true` (entrar na tela, voltar ao foco, parar a rolagem), ela toca de
 * novo.
 */
export function useAmbientMotion(requested = true): boolean {
  const focused = useScreenFocused();
  const reducedMotion = useReducedMotion();

  return requested && focused && !reducedMotion;
}
