import {
  addLocalDays,
  endOfLocalDay,
  startOfLocalDay,
  toLocalDayKey,
} from '@/lib/day';

import type { StatsBucket, StatsPeriod, StatsRange, StatsUnit } from './types';

const PERIOD_DAYS: Record<'1w' | '1m' | '3m', number> = {
  '1w': 7,
  '1m': 28,
  '3m': 84,
};

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  '1w': 'Últimos 7 dias',
  '1m': 'Últimas 4 semanas',
  '3m': 'Últimas 12 semanas',
  '1y': 'Últimos 12 meses',
};

const PERIOD_UNITS: Record<StatsPeriod, StatsUnit> = {
  '1w': 'day',
  '1m': 'week',
  '3m': 'week',
  '1y': 'month',
};

const MONTH_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

const MONTH_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

const WEEKDAY_SHORT = [
  'dom',
  'seg',
  'ter',
  'qua',
  'qui',
  'sex',
  'sáb',
] as const;

const WEEKDAY_LONG = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

/** `5/10`, sem zero à esquerda e sem depender do locale do aparelho. */
function shortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

/** `out` — rótulo curto de mês, sem depender do locale do aparelho. */
export function shortMonth(date: Date): string {
  return MONTH_SHORT[date.getMonth()] ?? MONTH_SHORT[0];
}

function dayBuckets(today: Date, days: number): StatsBucket[] {
  return Array.from({ length: days }, (_, index) => {
    const start = startOfLocalDay(addLocalDays(today, -(days - 1) + index));

    return {
      key: toLocalDayKey(start),
      label: WEEKDAY_SHORT[start.getDay()] ?? WEEKDAY_SHORT[0],
      description: `${WEEKDAY_LONG[start.getDay()] ?? WEEKDAY_LONG[0]}, ${shortDate(start)}`,
      start,
      end: endOfLocalDay(start),
    };
  });
}

function weekBuckets(today: Date, days: number): StatsBucket[] {
  const weeks = days / 7;
  // Com muitas barras o rótulo `5/10` não cabe; o dia do mês basta, e a
  // descrição acessível continua com o intervalo completo.
  const compactLabel = weeks > 6;

  return Array.from({ length: weeks }, (_, index) => {
    const start = startOfLocalDay(addLocalDays(today, -(days - 1) + index * 7));
    const end = endOfLocalDay(addLocalDays(start, 6));
    const day = start.getDate();

    return {
      key: toLocalDayKey(start),
      label: compactLabel ? String(day) : shortDate(start),
      description: `Semana de ${shortDate(start)} a ${shortDate(end)}`,
      start,
      end,
    };
  });
}

function monthBuckets(today: Date): StatsBucket[] {
  const todayEnd = endOfLocalDay(today);
  const year = today.getFullYear();
  const month = today.getMonth();

  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = month - 11 + index;
    const start = new Date(year, monthIndex, 1);
    const monthEnd = endOfLocalDay(new Date(year, monthIndex + 1, 0));
    const end = new Date(Math.min(monthEnd.getTime(), todayEnd.getTime()));

    return {
      key: toLocalDayKey(start),
      label: MONTH_SHORT[start.getMonth()] ?? MONTH_SHORT[0],
      description: `${MONTH_LONG[start.getMonth()] ?? MONTH_LONG[0]} de ${start.getFullYear()}`,
      start,
      end,
    };
  });
}

/**
 * Janela do período e do anterior, no dia local. Semanas terminam hoje (a
 * última barra é a semana corrente, incompleta); o ano são 12 meses corridos
 * terminando no mês atual. Tudo derivado de `today`, sem relógio global.
 */
export function statsRange(period: StatsPeriod, today: Date): StatsRange {
  const label = PERIOD_LABELS[period];
  const unit = PERIOD_UNITS[period];

  if (period === '1y') {
    const buckets = monthBuckets(today);
    const year = today.getFullYear();
    const month = today.getMonth();

    return {
      period,
      label,
      unit,
      from: new Date(year, month - 11, 1),
      to: endOfLocalDay(today),
      previous: {
        from: new Date(year, month - 23, 1),
        to: endOfLocalDay(new Date(year, month - 11, 0)),
      },
      buckets,
    };
  }

  const days = PERIOD_DAYS[period];
  const from = startOfLocalDay(addLocalDays(today, -(days - 1)));
  const to = endOfLocalDay(today);
  const previousTo = endOfLocalDay(addLocalDays(from, -1));

  return {
    period,
    label,
    unit,
    from,
    to,
    previous: {
      from: startOfLocalDay(addLocalDays(previousTo, -(days - 1))),
      to: previousTo,
    },
    buckets:
      unit === 'day' ? dayBuckets(today, days) : weekBuckets(today, days),
  };
}
