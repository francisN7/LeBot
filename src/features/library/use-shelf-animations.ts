import { useEffect, useRef, useState } from 'react';
import type { ListViewToken } from 'react-native';

/**
 * O que conta como “na tela” para animar. 20% é o bastante para o card já estar
 * legível; o resto que a lista monta fica em repouso.
 */
const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 20,
} as const;

/** Sem inércia, o fim do arrasto é a última pista de que a rolagem parou. */
const RESUME_DELAY_MS = 300;
/** Rede de segurança se o fim da inércia não chegar (gesto interrompido). */
const MOMENTUM_FALLBACK_MS = 2500;

const NO_IDS: ReadonlySet<string> = new Set<string>();

function sameIds(first: ReadonlySet<string>, second: ReadonlySet<string>) {
  if (first.size !== second.size) {
    return false;
  }

  for (const id of first) {
    if (!second.has(id)) {
      return false;
    }
  }

  return true;
}

export type ShelfAnimations = {
  /** Ids dos cards que devem rodar os loops agora. */
  animatingIds: ReadonlySet<string>;
  /** A grade está sob o dedo ou no meio da inércia. */
  scrolling: boolean;
  viewabilityConfig: typeof VIEWABILITY_CONFIG;
  onViewableItemsChanged: (info: { viewableItems: ListViewToken[] }) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: () => void;
};

/**
 * Decide quais lombadas da grade animam (S12b).
 *
 * A lista monta vários cards além da tela; sem filtro, todos rodam brilho,
 * piscada, “zzz” e tassel. Aqui só os visíveis entram no conjunto — e durante
 * o gesto o conjunto é ignorado, para os loops pararem enquanto a tela rola.
 *
 * O estado muda apenas quando o conjunto de ids muda de verdade: as
 * notificações de visibilidade chegam a cada quadro da rolagem.
 */
export function useShelfAnimations(): ShelfAnimations {
  const [animatingIds, setAnimatingIds] = useState<ReadonlySet<string>>(NO_IDS);
  const [scrolling, setScrolling] = useState(false);
  const visibleIdsRef = useRef<ReadonlySet<string>>(NO_IDS);
  const scrollingRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearResumeTimer() {
    if (resumeTimer.current !== null) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }

  function resume() {
    clearResumeTimer();

    if (!scrollingRef.current) {
      return;
    }

    scrollingRef.current = false;
    setScrolling(false);
    // O conjunto pode ter mudado durante o gesto: aplica o último conhecido.
    setAnimatingIds(visibleIdsRef.current);
  }

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) {
        clearTimeout(resumeTimer.current);
      }
    },
    [],
  );

  // `FlatList` reclama se `onViewableItemsChanged` ou `viewabilityConfig` mudam
  // entre renders: os dois ficam presos na primeira renderização.
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const next = new Set<string>();

      for (const token of viewableItems) {
        const book = token.item as { id?: unknown } | undefined;

        if (token.isViewable && typeof book?.id === 'string') {
          next.add(book.id);
        }
      }

      if (sameIds(next, visibleIdsRef.current)) {
        return;
      }

      visibleIdsRef.current = next;

      // Durante a rolagem tudo está pausado; o conjunto é aplicado ao parar.
      if (!scrollingRef.current) {
        setAnimatingIds(next);
      }
    },
  ).current;

  return {
    animatingIds,
    scrolling,
    viewabilityConfig: VIEWABILITY_CONFIG,
    onViewableItemsChanged,
    onScrollBeginDrag() {
      clearResumeTimer();
      scrollingRef.current = true;
      setScrolling(true);
    },
    onScrollEndDrag() {
      clearResumeTimer();
      resumeTimer.current = setTimeout(resume, RESUME_DELAY_MS);
    },
    onMomentumScrollBegin() {
      // A inércia continua: segura a pausa até o fim ou a rede de segurança.
      clearResumeTimer();
      resumeTimer.current = setTimeout(resume, MOMENTUM_FALLBACK_MS);
    },
    onMomentumScrollEnd() {
      resume();
    },
  };
}
