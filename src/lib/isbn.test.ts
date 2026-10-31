import { isValidIsbn, normalizeIsbn, toStoredIsbn } from './isbn';

describe('normalizeIsbn', () => {
  it('remove hífens, espaços e normaliza o X', () => {
    expect(normalizeIsbn(' 978-0-306-40615-7 ')).toBe('9780306406157');
    expect(normalizeIsbn('0-8044-2957-x')).toBe('080442957X');
  });
});

describe('isValidIsbn', () => {
  it('aceita ISBN-10 com dígito verificador correto', () => {
    expect(isValidIsbn('0306406152')).toBe(true);
    expect(isValidIsbn('0-8044-2957-X')).toBe(true);
  });

  it('aceita ISBN-13 com dígito verificador correto', () => {
    expect(isValidIsbn('9780306406157')).toBe(true);
    expect(isValidIsbn('978-85-359-0000-2')).toBe(true);
  });

  it('rejeita dígito verificador errado', () => {
    expect(isValidIsbn('0306406153')).toBe(false);
    expect(isValidIsbn('9780306406158')).toBe(false);
  });

  it('rejeita tamanho, caracteres e X fora da última posição', () => {
    expect(isValidIsbn('')).toBe(false);
    expect(isValidIsbn('123')).toBe(false);
    expect(isValidIsbn('978030640615')).toBe(false);
    expect(isValidIsbn('97803064061577')).toBe(false);
    expect(isValidIsbn('X306406152')).toBe(false);
    expect(isValidIsbn('ISBN 9780306406157')).toBe(false);
  });
});

describe('toStoredIsbn', () => {
  it('devolve o ISBN normalizado', () => {
    expect(toStoredIsbn(' 978-0-306-40615-7 ')).toBe('9780306406157');
  });

  it('devolve null para campo vazio ou ausente', () => {
    expect(toStoredIsbn('   ')).toBeNull();
    expect(toStoredIsbn(null)).toBeNull();
    expect(toStoredIsbn(undefined)).toBeNull();
  });
});
