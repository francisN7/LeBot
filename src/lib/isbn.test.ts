import {
  formatIsbnInput,
  isValidIsbn,
  normalizeIsbn,
  toStoredIsbn,
} from './isbn';

describe('normalizeIsbn', () => {
  it('remove hífens, espaços e normaliza o X', () => {
    expect(normalizeIsbn(' 978-0-306-40615-7 ')).toBe('9780306406157');
    expect(normalizeIsbn('0-8044-2957-x')).toBe('080442957X');
  });
});

describe('formatIsbnInput', () => {
  it('formata o ISBN-10 enquanto digita', () => {
    expect(formatIsbnInput('8')).toBe('8');
    expect(formatIsbnInput('85')).toBe('85');
    expect(formatIsbnInput('8535')).toBe('85-35');
    expect(formatIsbnInput('8535902772')).toBe('85-359-0277-2');
  });

  it('troca para o padrão de 13 dígitos ao chegar no prefixo', () => {
    expect(formatIsbnInput('978')).toBe('978');
    expect(formatIsbnInput('97885359027')).toBe('978-85-359-027');
    expect(formatIsbnInput('9788535902772')).toBe('978-85-359-0277-2');
  });

  it('reaplica a máscara sobre texto já hifenizado', () => {
    expect(formatIsbnInput('978-85-359-0277-2')).toBe('978-85-359-0277-2');
    expect(formatIsbnInput(' 85 359 0277 2 ')).toBe('85-359-0277-2');
    expect(formatIsbnInput('abc')).toBe('');
  });

  it('limita a 13 dígitos', () => {
    expect(formatIsbnInput('9788535902772999')).toBe('978-85-359-0277-2');
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
