import { daysBetween, toLocalDayKey } from './day';

describe('toLocalDayKey', () => {
  it('formata o dia local com zero à esquerda', () => {
    expect(toLocalDayKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('usa o dia local e ignora a hora', () => {
    expect(toLocalDayKey(new Date(2026, 9, 31, 0, 0))).toBe('2026-10-31');
    expect(toLocalDayKey(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31');
  });
});

describe('daysBetween', () => {
  it('devolve 0 no mesmo dia, mesmo com horas diferentes', () => {
    expect(
      daysBetween(new Date(2026, 9, 31, 0, 1), new Date(2026, 9, 31, 23, 59)),
    ).toBe(0);
  });

  it('conta a virada do dia', () => {
    expect(
      daysBetween(new Date(2026, 9, 30, 23, 59), new Date(2026, 9, 31, 0, 1)),
    ).toBe(1);
  });

  it('atravessa mês e ano', () => {
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 10, 2))).toBe(2);
    expect(daysBetween(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
  });

  it('conta uma semana inteira', () => {
    expect(daysBetween(new Date(2026, 9, 24), new Date(2026, 9, 31))).toBe(7);
  });

  it('é negativo quando `from` vem depois de `to`', () => {
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 9, 28))).toBe(-3);
  });
});
