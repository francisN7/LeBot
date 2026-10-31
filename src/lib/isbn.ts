/**
 * ISBN no aparelho: normalizado e validado sem consultar nenhum serviço.
 * Aceita ISBN-10 (com `X` no último dígito) e ISBN-13, com ou sem hífens.
 *
 * O banco guarda sempre o valor normalizado. A máscara com hífens existe só na
 * UI (`formatIsbnInput`): não usa a tabela oficial de ranges, então o grupo é
 * fixado no padrão brasileiro (978-85-… e 85-…).
 */

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

/** Grupos do ISBN-13 no padrão brasileiro (978-85-359-0277-2). */
const ISBN_13_GROUPS = [3, 2, 3, 4, 1] as const;

/** Grupos do ISBN-10 no padrão brasileiro (85-359-0277-2). */
const ISBN_10_GROUPS = [2, 3, 4, 1] as const;

/**
 * Aplica a máscara enquanto o dono digita. O prefixo 978/979 troca o layout
 * para ISBN-13; qualquer outro começo assume ISBN-10.
 *
 * - `8535` → `85-35`
 * - `97885359027` → `978-85-359-027`
 * - `9788535902772` → `978-85-359-0277-2`
 */
export function formatIsbnInput(value: string): string {
  const digits = isbnPayload(value).slice(0, 13);

  if (digits.length === 0) {
    return '';
  }

  const isbn13 = digits.startsWith('978') || digits.startsWith('979');
  const groups = isbn13 ? ISBN_13_GROUPS : ISBN_10_GROUPS;
  const chunks: string[] = [];
  let index = 0;

  for (const size of groups) {
    if (index >= digits.length) {
      break;
    }

    chunks.push(digits.slice(index, index + size));
    index += size;
  }

  return chunks.join('-');
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
