import { goalInputValue, parseGoalInput } from './goal';

describe('parseGoalInput', () => {
  it('aceita os limites e um valor normal', () => {
    expect(parseGoalInput('3')).toEqual({ ok: true, pages: 3 });
    expect(parseGoalInput('18')).toEqual({ ok: true, pages: 18 });
    expect(parseGoalInput('200')).toEqual({ ok: true, pages: 200 });
  });

  it('aceita espaços e zeros à esquerda', () => {
    expect(parseGoalInput(' 018 ')).toEqual({ ok: true, pages: 18 });
  });

  it('recusa vazio, texto e decimal', () => {
    expect(parseGoalInput('')).toMatchObject({ ok: false });
    expect(parseGoalInput('dezoito')).toMatchObject({ ok: false });
    expect(parseGoalInput('18,5')).toMatchObject({ ok: false });
    expect(parseGoalInput('18.5')).toMatchObject({ ok: false });
  });

  it('recusa fora do intervalo do motor', () => {
    expect(parseGoalInput('2')).toEqual({
      ok: false,
      message: 'A meta fica entre 3 e 200 páginas.',
    });
    expect(parseGoalInput('201')).toEqual({
      ok: false,
      message: 'A meta fica entre 3 e 200 páginas.',
    });
  });
});

describe('goalInputValue', () => {
  it('usa o padrão quando a chave não existe', () => {
    expect(goalInputValue(undefined)).toBe('18');
  });

  it('preserva o valor salvo', () => {
    expect(goalInputValue('24')).toBe('24');
  });
});
