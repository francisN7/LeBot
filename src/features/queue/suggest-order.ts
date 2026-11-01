export type OrderCandidate = {
  id: string;
  genreId: string;
};

/**
 * Sugestão anti-ressaca: mantém o primeiro livro (a intenção do dono) e, a
 * cada passo, pega o primeiro restante de gênero diferente do anterior. Sem
 * opção, repete o gênero. Determinística e idempotente.
 */
export function suggestOrder<T extends OrderCandidate>(
  items: readonly T[],
): T[] {
  const [first, ...rest] = items;

  if (!first) {
    return [];
  }

  const remaining = [...rest];
  const result: T[] = [first];
  let previousGenreId = first.genreId;

  while (remaining.length > 0) {
    const index = remaining.findIndex(
      (item) => item.genreId !== previousGenreId,
    );
    const [next] = remaining.splice(Math.max(index, 0), 1);

    if (!next) {
      break;
    }

    result.push(next);
    previousGenreId = next.genreId;
  }

  return result;
}
