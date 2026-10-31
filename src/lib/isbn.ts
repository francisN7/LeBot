/**
 * ISBN no aparelho: normalizado e validado sem consultar nenhum serviço.
 * Aceita ISBN-10 (com `X` no último dígito) e ISBN-13, com ou sem hífens.
 */

/** Remove espaços e hífens e deixa o `X` final em maiúscula. */
export function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
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
