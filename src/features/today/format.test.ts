import { formatReadTime, formatTodayLabel } from './format';

describe('formatTodayLabel', () => {
  it('escreve dia da semana e data em PT-BR', () => {
    expect(formatTodayLabel(new Date(2026, 9, 31, 9))).toBe(
      'sábado, 31 de outubro',
    );
  });

  it('devolve vazio para data inválida', () => {
    expect(formatTodayLabel(new Date(Number.NaN))).toBe('');
  });
});

describe('formatReadTime', () => {
  it('usa a hora local com dois dígitos', () => {
    expect(formatReadTime(new Date(2026, 9, 31, 8, 5))).toBe('08:05');
    expect(formatReadTime(new Date(2026, 9, 31, 21, 40))).toBe('21:40');
  });

  it('devolve vazio para data inválida', () => {
    expect(formatReadTime(new Date(Number.NaN))).toBe('');
  });
});
