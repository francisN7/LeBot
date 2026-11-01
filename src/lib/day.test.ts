import {
  addLocalDays,
  daysBetween,
  endOfLocalDay,
  startOfLocalDay,
  toLocalDayKey,
} from './day';

describe('toLocalDayKey', () => {
  it('usa o dia local, não UTC', () => {
    expect(toLocalDayKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
    expect(toLocalDayKey(new Date(2026, 9, 31, 0, 0))).toBe('2026-10-31');
    expect(toLocalDayKey(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31');
  });
});

describe('daysBetween', () => {
  it('conta dias de calendário', () => {
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 10, 2))).toBe(2);
    expect(daysBetween(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
    expect(daysBetween(new Date(2026, 9, 31), new Date(2026, 9, 28))).toBe(-3);
  });
});

describe('startOfLocalDay / endOfLocalDay', () => {
  it('abre na meia-noite e fecha no último milissegundo', () => {
    const date = new Date(2026, 10, 1, 15, 42, 10, 500);

    expect(startOfLocalDay(date)).toEqual(new Date(2026, 10, 1, 0, 0, 0, 0));
    expect(endOfLocalDay(date)).toEqual(new Date(2026, 10, 1, 23, 59, 59, 999));
  });
});

describe('addLocalDays', () => {
  it('atravessa mês e ano', () => {
    expect(addLocalDays(new Date(2026, 10, 1), -1)).toEqual(
      new Date(2026, 9, 31),
    );
    expect(addLocalDays(new Date(2026, 0, 1), -1)).toEqual(
      new Date(2025, 11, 31),
    );
  });
});
