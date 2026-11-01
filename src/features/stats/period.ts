import {
  addLocalDays,
  endOfLocalDay,
  startOfLocalDay,
  toLocalDayKey,
} from '@/lib/day';

import type { StatsBucket, StatsPeriod, StatsRange } from './types';

const PERIOD_DAYS: Record<'4w' | '12w', number> = { '4w': 28, '12w': 84 };

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  '4w': 'Últimas 4 semanas',
  '12w': 'Últimas 12 semanas',
  year: 'Últimos 12 meses',
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

/** `12/10`, sem depender do locale do aparelho. */
function shortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/** `out` — rótulo curto de mês, sem depender do locale do aparelho. */
export function shortMonth(date: Date): string {
  return MONTH_SHORT[date.getMonth()] ?? MONTH_SHORT[0];
}

function weekBuckets(today: Date, days: number): StatsBucket[] {
  const weeks = days / 7;

  return Array.from({ length: weeks }, (_, index) => {
    const start = startOfLocalDay(addLocalDays(today, -(days - 1) + index * 7));
    const end = endOfLocalDay(addLocalDays(start, 6));
    const label = shortDate(start);

    return {
      key: toLocalDayKey(start),
      label,
      description: `Semana de ${label} a ${shortDate(end)}`,
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

  if (period === 'year') {
    const buckets = monthBuckets(today);
    const year = today.getFullYear();
    const month = today.getMonth();

    return {
      period,
      label,
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
    from,
    to,
    previous: {
      from: startOfLocalDay(addLocalDays(previousTo, -(days - 1))),
      to: previousTo,
    },
    buckets: weekBuckets(today, days),
  };
}
