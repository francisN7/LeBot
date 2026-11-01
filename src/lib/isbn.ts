/**
 * ISBN no aparelho: normalizado e validado sem consultar nenhum serviço.
 * Aceita ISBN-10 (com `X` no último dígito) e ISBN-13, com ou sem hífens.
 *
 * O banco guarda sempre o valor normalizado. A máscara com hífens existe só na
 * UI (`formatIsbnInput`) e resolve grupo, registrante e publicação pela tabela
 * oficial da International ISBN Agency (`./isbn-ranges`, gerada por script).
 */

import { ISBN_GROUP_RULES } from './isbn-ranges';

/** Remove espaços e hífens e deixa o `X` final em maiúscula. */
export function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Só dígitos e `X`, descartando o que o teclado/paste trouxer de estranho.
 * É o valor que a máscara usa para se posicionar.
 */
function isbnPayload(value: string): string {
  return normalizeIsbn(value).replace(/[^0-9X]/g, '');
}

type RangeRule = { start: number; end: number; length: number };

/** Grupos válidos por EAN (978/979), como `"0"`, `"85"`, `"10"`. */
const groupsByEan = new Map<string, string[]>();

for (const key of Object.keys(ISBN_GROUP_RULES)) {
  const separator = key.indexOf('-');
  const ean = key.slice(0, separator);
  const group = key.slice(separator + 1);
  const groups = groupsByEan.get(ean) ?? [];
  groups.push(group);
  groupsByEan.set(ean, groups);
}

/** A tabela vem como `inicio:tamanho`; o fim é o início seguinte menos um. */
const rulesCache = new Map<string, readonly RangeRule[]>();

function rulesFor(ean: string, group: string): readonly RangeRule[] {
  const key = `${ean}-${group}`;
  const cached = rulesCache.get(key);

  if (cached) {
    return cached;
  }

  const raw = ISBN_GROUP_RULES[key];
  const segments = raw ? raw.split(' ') : [];
  const rules = segments.map((segment, index) => {
    const separator = segment.indexOf(':');
    const start = Number(segment.slice(0, separator));
    const length = Number(segment.slice(separator + 1));
    const next = segments[index + 1];
    const end = next ? Number(next.slice(0, next.indexOf(':'))) - 1 : 9_999_999;

    return { start, end, length };
  });

  rulesCache.set(key, rules);
  return rules;
}

/**
 * Grupo do ISBN pelo prefixo, do mais longo para o mais curto (o grupo tem 1 a
 * 5 dígitos). Enquanto o que foi digitado ainda não fecha nenhum grupo, devolve
 * `null` para a máscara não "pular".
 */
function resolveGroup(ean: string, body: string): string | null {
  const groups = groupsByEan.get(ean) ?? [];
  let match: string | null = null;

  for (const group of groups) {
    if (body.startsWith(group) && group.length > (match?.length ?? 0)) {
      match = group;
    }
  }

  return match;
}

/**
 * Tamanho do registrante para o que já foi digitado depois do grupo, ou 0
 * quando não dá para decidir (faixa não atribuída ou ambígua com poucos
 * dígitos). Com 7 dígitos a faixa é exata; com menos, só entra hífen se todas
 * as faixas candidatas concordarem.
 */
function resolveRegistrantLength(
  ean: string,
  group: string,
  rest: string,
): number {
  const rules = rulesFor(ean, group);

  if (rules.length === 0) {
    return 0;
  }

  const probe = rest.slice(0, 7);
  const lower = Number(probe.padEnd(7, '0'));
  const upper = Number(probe.padEnd(7, '9'));
  const candidates = rules.filter(
    (rule) => rule.start <= upper && rule.end >= lower,
  );

  if (probe.length === 7) {
    const exact = candidates.find(
      (rule) => lower >= rule.start && lower <= rule.end,
    );
    return exact?.length ?? 0;
  }

  if (candidates.length === 0 || candidates.some((rule) => rule.length === 0)) {
    return 0;
  }

  const lengths = [...new Set(candidates.map((rule) => rule.length))];
  return lengths.length === 1 ? (lengths[0] ?? 0) : 0;
}

/**
 * Quebra o ISBN em partes: `[grupo, registrante, publicação, verificador]`.
 * `body` é o ISBN sem o EAN (ISBN-13) ou o ISBN-10 inteiro, que usa o grupo do
 * prefixo 978. Devolve `null` quando o grupo ainda não é conhecido.
 */
function splitIsbn(
  ean: string,
  body: string,
  hasCheck: boolean,
): string[] | null {
  const group = resolveGroup(ean, body);

  if (!group) {
    return null;
  }

  const parts = [group];
  const rest = body.slice(group.length);

  if (rest.length === 0) {
    return parts;
  }

  const registrantLength = resolveRegistrantLength(ean, group, rest);
  const registrant = rest.slice(0, registrantLength);
  const tail = rest.slice(registrantLength);

  if (registrant.length > 0) {
    parts.push(registrant);
  }

  if (tail.length === 0) {
    return parts;
  }

  if (hasCheck) {
    parts.push(tail.slice(0, -1), tail.slice(-1));
  } else {
    parts.push(tail);
  }

  return parts.filter((part) => part.length > 0);
}

/**
 * Aplica a máscara enquanto o dono digita. O prefixo 978/979 troca o layout
 * para ISBN-13; qualquer outro começo assume ISBN-10.
 *
 * - `8535` → `85-35`
 * - `97885359027` → `978-85-359-027`
 * - `9788535902772` → `978-85-359-0277-2`
 * - `9780306406157` → `978-0-306-40615-7`
 * - `9791090636071` → `979-10-90636-07-1`
 */
export function formatIsbnInput(value: string): string {
  const digits = isbnPayload(value).slice(0, 13);

  if (digits.length === 0) {
    return '';
  }

  const isbn13 =
    digits.startsWith('978') || digits.startsWith('979') || digits.length > 10;
  const ean = isbn13 ? digits.slice(0, 3) : '978';
  const body = isbn13 ? digits.slice(3) : digits;
  const total = isbn13 ? 13 : 10;
  const parts = splitIsbn(ean, body, digits.length === total);

  if (!parts) {
    return digits;
  }

  return (isbn13 ? [ean, ...parts] : parts).join('-');
}

function isValidIsbn10(isbn: string): boolean {
  let sum = 0;

  for (let index = 0; index < 10; index += 1) {
    const char = isbn[index];
    sum += (char === 'X' ? 10 : Number(char)) * (10 - index);
  }

  return sum % 11 === 0;
}

function isValidIsbn13(isbn: string): boolean {
  let sum = 0;

  for (let index = 0; index < 13; index += 1) {
    sum += Number(isbn[index]) * (index % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}

/** `true` para ISBN-10/13 com dígito verificador correto. */
export function isValidIsbn(value: string): boolean {
  const isbn = normalizeIsbn(value);

  if (/^\d{9}[\dX]$/.test(isbn)) {
    return isValidIsbn10(isbn);
  }

  if (/^\d{13}$/.test(isbn)) {
    return isValidIsbn13(isbn);
  }

  return false;
}

/** Devolve o ISBN pronto para gravar: normalizado ou `null` quando vazio. */
export function toStoredIsbn(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const isbn = normalizeIsbn(value);
  return isbn.length === 0 ? null : isbn;
}
