import { act, renderHook } from '@testing-library/react-native';

import { useShelfAnimations } from './use-shelf-animations';

function visible(ids: string[]) {
  return {
    viewableItems: ids.map((id, index) => ({
      index,
      isViewable: true,
      item: { id },
      key: id,
    })),
  };
}

describe('useShelfAnimations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('anima só os cards visíveis e pausa durante a rolagem', async () => {
    const { result } = await renderHook(() => useShelfAnimations());

    // Antes da primeira medição, nada anima.
    expect(result.current.animatingIds.size).toBe(0);
    expect(result.current.scrolling).toBe(false);

    await act(() => {
      result.current.onViewableItemsChanged(visible(['a', 'b']));
    });

    expect([...result.current.animatingIds]).toEqual(['a', 'b']);

    await act(() => {
      result.current.onScrollBeginDrag();
    });

    expect(result.current.scrolling).toBe(true);

    // Visibilidade muda no meio do gesto, mas nada acende até parar.
    await act(() => {
      result.current.onViewableItemsChanged(visible(['c']));
    });

    expect([...result.current.animatingIds]).toEqual(['a', 'b']);

    await act(() => {
      result.current.onMomentumScrollEnd();
    });

    expect(result.current.scrolling).toBe(false);
    expect([...result.current.animatingIds]).toEqual(['c']);
  });

  it('não re-renderiza quando o conjunto visível não muda', async () => {
    const { result } = await renderHook(() => useShelfAnimations());

    await act(() => {
      result.current.onViewableItemsChanged(visible(['a', 'b']));
    });

    const ids = result.current.animatingIds;

    // Mesmo conteúdo em outra ordem: a referência tem que continuar a mesma.
    await act(() => {
      result.current.onViewableItemsChanged(visible(['b', 'a']));
    });

    expect(result.current.animatingIds).toBe(ids);
  });

  it('retoma sozinho quando o fim do arrasto não vem com inércia', async () => {
    const { result } = await renderHook(() => useShelfAnimations());

    await act(() => {
      result.current.onViewableItemsChanged(visible(['a']));
    });
    await act(() => {
      result.current.onScrollBeginDrag();
    });
    await act(() => {
      result.current.onScrollEndDrag();
    });

    expect(result.current.scrolling).toBe(true);

    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current.scrolling).toBe(false);
    expect([...result.current.animatingIds]).toEqual(['a']);
  });

  it('segura a pausa enquanto a inércia continua e tem rede de segurança', async () => {
    const { result } = await renderHook(() => useShelfAnimations());

    await act(() => {
      result.current.onViewableItemsChanged(visible(['a']));
    });
    await act(() => {
      result.current.onScrollBeginDrag();
    });
    await act(() => {
      result.current.onScrollEndDrag();
    });
    await act(() => {
      result.current.onMomentumScrollBegin();
    });

    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current.scrolling).toBe(true);

    // Sem o evento de fim, o timer longo religa os loops.
    await act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(result.current.scrolling).toBe(false);
  });
});
