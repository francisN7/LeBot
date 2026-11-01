import { statsRange } from './period';

const today = new Date(2026, 10, 1, 12); // domingo, 1º de novembro de 2026

describe('statsRange', () => {
  it('cobre as últimas 4 semanas, terminando hoje', () => {
    const range = statsRange('4w', today);

    expect(range.label).toBe('Últimas 4 semanas');
    expect(range.from).toEqual(new Date(2026, 9, 5));
    expect(range.to).toEqual(new Date(2026, 10, 1, 23, 59, 59, 999));
    expect(range.buckets).toHaveLength(4);
    expect(range.buckets[0]?.label).toBe('05/10');
    expect(range.buckets[3]?.label).toBe('26/10');
    expect(range.buckets[3]?.end).toEqual(range.to);
  });

  it('encadeia a janela anterior sem sobrepor o período', () => {
    const range = statsRange('4w', today);

    expect(range.previous.to).toEqual(new Date(2026, 9, 4, 23, 59, 59, 999));
    expect(range.previous.from).toEqual(new Date(2026, 8, 7));
  });

  it('mostra 12 semanas no período médio', () => {
    const range = statsRange('12w', today);

    expect(range.buckets).toHaveLength(12);
    expect(range.from).toEqual(new Date(2026, 7, 10));
  });

  it('no ano, agrupa por mês e termina no mês corrente', () => {
    const range = statsRange('year', today);

    expect(range.label).toBe('Últimos 12 meses');
    expect(range.buckets).toHaveLength(12);
    expect(range.buckets[0]?.label).toBe('dez');
    expect(range.buckets[0]?.description).toBe('Dezembro de 2025');
    expect(range.buckets[11]?.label).toBe('nov');
    expect(range.buckets[11]?.end).toEqual(range.to);
    expect(range.previous.from).toEqual(new Date(2024, 11, 1));
    expect(range.previous.to).toEqual(new Date(2025, 10, 30, 23, 59, 59, 999));
  });
});
