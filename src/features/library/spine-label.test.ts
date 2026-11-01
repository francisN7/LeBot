import { fitSpineTitle } from './spine-label';

const base = {
  maxFontSize: 7,
  minFontSize: 5,
  width: 40,
};

describe('fitSpineTitle', () => {
  it('mantém a fonte máxima para um título curto', () => {
    expect(fitSpineTitle({ ...base, title: 'O Hobbit' })).toBe(7);
  });

  it('diminui a fonte para um título que não cabe em duas linhas', () => {
    const fontSize = fitSpineTitle({
      ...base,
      title: 'Orgulho e Preconceito',
    });

    expect(fontSize).toBeLessThan(7);
    expect(fontSize).toBeGreaterThanOrEqual(5);
  });

  it('para no mínimo e deixa o ellipsis para o texto enorme', () => {
    const fontSize = fitSpineTitle({
      ...base,
      title: 'Um título absurdamente longo que nunca caberia na lombada',
    });

    expect(fontSize).toBe(5);
  });

  it('usa a fonte máxima para título vazio', () => {
    expect(fitSpineTitle({ ...base, title: '   ' })).toBe(7);
  });

  it('considera a largura disponível', () => {
    const fontSize = fitSpineTitle({
      ...base,
      title: 'Sapiens',
      width: 12,
    });

    expect(fontSize).toBeLessThan(7);
    expect(fontSize).toBeGreaterThanOrEqual(5);
  });
});
