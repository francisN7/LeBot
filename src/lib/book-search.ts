/**
 * Busca local da estante. Filtra em memória: a estante de um aparelho é
 * pequena e assim a busca ignora acento e caixa sem depender de `LIKE`.
 */

/** Minúsculas e sem acento, para comparar "Príncipe" com "principe". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** `true` quando algum campo contém o termo (ou quando o termo é vazio). */
export function matchesQuery(
  fields: readonly (string | null | undefined)[],
  query: string,
): boolean {
  const needle = normalizeText(query);

  if (needle.length === 0) {
    return true;
  }

  return fields.some(
    (field) =>
      typeof field === 'string' && normalizeText(field).includes(needle),
  );
}
