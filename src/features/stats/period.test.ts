import { statsRange } from './period';

const today = new Date(2026, 10, 1, 12); // domingo, 1º de novembro de 2026

describe('statsRange', () => {
  it('na semana, mostra os últimos 7 dias, um por barra', () => {
    const range = statsRange('1w', today);

    expect(range.label).toBe('Últimos 7 dias');
    expect(range.unit).toBe('day');
    expect(range.from).toEqual(new Date(2026, 9, 26));
    expect(range.to).toEqual(new Date(2026, 10, 1, 23, 59, 59, 999));
    expect(range.currentKey).toBe('2026-11-01');
    expect(range.buckets).toHaveLength(7);
    expect(range.buckets.map((bucket) => bucket.label)).toEqual([
      'seg',
      'ter',
      'qua',
      'qui',
      'sex',
      'sáb',
      'dom',
    ]);
    expect(range.buckets.at(-1)?.end).toEqual(range.to);
    expect(range.previous.from).toEqual(new Date(2026, 9, 19));
    expect(range.previous.to).toEqual(new Date(2026, 9, 25, 23, 59, 59, 999));
  });

  it('no mês, cobre o mês civil do dia 1 até hoje', () => {
    const range = statsRange('1m', today);

    expect(range.label).toBe('Novembro de 2026');
    expect(range.unit).toBe('week');
    expect(range.from).toEqual(new Date(2026, 10, 1));
    expect(range.to).toEqual(new Date(2026, 10, 1, 23, 59, 59, 999));
    expect(range.currentKey).toBe('2026-11-01');
    expect(range.buckets.map((bucket) => bucket.label)).toEqual([
      '1/11',
      '8/11',
      '15/11',
      '22/11',
      '29/11',
    ]);
    // A semana anterior é o mês civil anterior inteiro.
    expect(range.previous.from).toEqual(new Date(2026, 9, 1));
    expect(range.previous.to).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
  });

  it('no trimestre, usa o mês atual e os dois anteriores', () => {
    const range = statsRange('3m', today);

    expect(range.label).toBe('Setembro a novembro de 2026');
    expect(range.unit).toBe('month');
    expect(range.from).toEqual(new Date(2026, 8, 1));
    expect(range.currentKey).toBe('2026-11-01');
    expect(range.buckets.map((bucket) => bucket.label)).toEqual([
      'set',
      'out',
      'nov',
    ]);
    expect(range.previous.from).toEqual(new Date(2026, 5, 1));
    expect(range.previous.to).toEqual(new Date(2026, 7, 31, 23, 59, 59, 999));
  });

  it('no trimestre que cruza o ano, mostra o ano em cada barra', () => {
    const january = new Date(2026, 0, 15);

    expect(statsRange('3m', january).label).toBe(
      'Novembro de 2025 a janeiro de 2026',
    );
    expect(
      statsRange('3m', january).buckets.map((bucket) => bucket.label),
    ).toEqual(['nov/25', 'dez/25', 'jan/26']);
  });

  it('no ano, usa o ano civil com janeiro na primeira barra', () => {
    const range = statsRange('1y', today);

    expect(range.label).toBe('2026');
    expect(range.unit).toBe('month');
    expect(range.from).toEqual(new Date(2026, 0, 1));
    expect(range.buckets).toHaveLength(12);
    expect(range.buckets[0]?.label).toBe('jan');
    expect(range.buckets[11]?.label).toBe('dez');
    expect(range.currentKey).toBe('2026-11-01');
    expect(range.previous.from).toEqual(new Date(2025, 0, 1));
    expect(range.previous.to).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999));
  });
});
