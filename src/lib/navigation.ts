/**
 * Guarda de navegação para toque duplo: `router.push` disparado duas vezes
 * durante a animação empilha a mesma tela. A guarda aceita o primeiro toque e
 * ignora os seguintes dentro da janela.
 */
export function createNavigationGuard(
  gapMs = 500,
  now: () => number = Date.now,
): () => boolean {
  let lastAt = Number.NEGATIVE_INFINITY;

  return function allowNavigation(): boolean {
    const current = now();

    if (current - lastAt < gapMs) {
      return false;
    }

    lastAt = current;
    return true;
  };
}
