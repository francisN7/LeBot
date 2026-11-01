import {
  addLocalDays,
  endOfLocalDay,
  startOfLocalDay,
  toLocalDayKey,
} from '@/lib/day';

import type { StatsBucket, StatsPeriod, StatsRange, StatsUnit } from './types';

const PERIOD_UNITS: Record<StatsPeriod, StatsUnit> = {
  '1w': 'day',
  '1m': 'week',
  '3m': 'month',
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

function monthShort(month: number): string {
  return MONTH_SHORT[month] ?? MONTH_SHORT[0];
}

function monthLong(month: number): string {
  return MONTH_LONG[month] ?? MONTH_LONG[0];
}

/** `5/10`, sem zero à esquerda e sem depender do locale do aparelho. */
function shortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

/** `out` — rótulo curto de mês, sem depender do locale do aparelho. */
export function shortMonth(date: Date): string {
  return monthShort(date.getMonth());
}

/** `Outubro` — nome do mês para textos e leitor de tela. */
export function longMonth(date: Date): string {
  return monthLong(date.getMonth());
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

/**
 * Semanas do mês civil em blocos de 7 dias desde o dia 1 (1–7, 8–14…). Não
 * alinha à segunda-feira de propósito: o mês começa no dia 1 e as barras
 * cobrem o mês inteiro, inclusive os dias que ainda não chegaram.
 */
function monthChunks(year: number, month: number): StatsBucket[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const chunks: StatsBucket[] = [];

  for (let day = 1; day <= lastDay; day += 7) {
    const endDay = Math.min(day + 6, lastDay);
    const start = new Date(year, month, day);
    const end = endOfLocalDay(new Date(year, month, endDay));

    chunks.push({
      key: toLocalDayKey(start),
      label: shortDate(start),
      description: `${day} a ${endDay} de ${monthLong(month).toLowerCase()}`,
      start,
      end,
    });
  }

  return chunks;
}

function monthBuckets(year: number, months: number[], withYear: boolean) {
  return months.map((month): StatsBucket => {
    const start = new Date(year, month, 1);
    const monthIndex = start.getMonth();
    const startYear = start.getFullYear();

    return {
      key: toLocalDayKey(start),
      label: withYear
        ? `${monthShort(monthIndex)}/${String(startYear).slice(-2)}`
        : monthShort(monthIndex),
      description: `${monthLong(monthIndex)} de ${startYear}`,
      start,
      end: endOfLocalDay(new Date(startYear, monthIndex + 1, 0)),
    };
  });
}

function bucketAt(buckets: StatsBucket[], date: Date): StatsBucket | undefined {
  return buckets.find((bucket) => date >= bucket.start && date <= bucket.end);
}

function threeMonthLabel(today: Date): string {
  const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);

  if (start.getFullYear() === end.getFullYear()) {
    return `${monthLong(start.getMonth())} a ${monthLong(end.getMonth()).toLowerCase()} de ${end.getFullYear()}`;
  }

  return `${monthLong(start.getMonth())} de ${start.getFullYear()} a ${monthLong(end.getMonth()).toLowerCase()} de ${end.getFullYear()}`;
}

/**
 * Janelas civis, no dia local:
 * - 1 semana: últimos 7 dias (rotativo), uma barra por dia;
 * - 1 mês: do dia 1 até hoje, uma barra por bloco de 7 dias do mês;
 * - 3 meses: mês atual + os dois anteriores, uma barra por mês;
 * - 1 ano: ano civil (jan→dez), uma barra por mês; meses futuros ficam vazios.
 * O total sempre para em hoje. A janela anterior é o período civil equivalente.
 */
export function statsRange(period: StatsPeriod, today: Date): StatsRange {
  const year = today.getFullYear();
  const month = today.getMonth();
  const to = endOfLocalDay(today);
  const unit = PERIOD_UNITS[period];

  if (period === '1w') {
    const from = startOfLocalDay(addLocalDays(today, -6));
    const previousTo = endOfLocalDay(addLocalDays(from, -1));
    const buckets = dayBuckets(today, 7);

    return {
      period,
      label: 'Últimos 7 dias',
      unit,
      from,
      to,
      previous: {
        from: startOfLocalDay(addLocalDays(previousTo, -6)),
        to: previousTo,
      },
      buckets,
      currentKey: toLocalDayKey(today),
    };
  }

  if (period === '1m') {
    const from = new Date(year, month, 1);
    const buckets = monthChunks(year, month);
    const current = bucketAt(buckets, today);

    return {
      period,
      label: `${monthLong(month)} de ${year}`,
      unit,
      from,
      to,
      previous: {
        from: new Date(year, month - 1, 1),
        to: endOfLocalDay(new Date(year, month, 0)),
      },
      buckets,
      currentKey: current?.key ?? toLocalDayKey(from),
    };
  }

  if (period === '3m') {
    const fromMonth = month - 2;
    const months = [fromMonth, month - 1, month];
    const start = new Date(year, fromMonth, 1);
    const buckets = monthBuckets(
      year,
      months,
      new Date(year, month, 1).getFullYear() !== start.getFullYear(),
    );

    return {
      period,
      label: threeMonthLabel(today),
      unit,
      from: start,
      to,
      previous: {
        from: new Date(year, month - 5, 1),
        to: endOfLocalDay(new Date(year, month - 2, 0)),
      },
      buckets,
      currentKey: toLocalDayKey(new Date(year, month, 1)),
    };
  }

  return {
    period,
    label: String(year),
    unit,
    from: new Date(year, 0, 1),
    to,
    previous: {
      from: new Date(year - 1, 0, 1),
      to: endOfLocalDay(new Date(year - 1, 11, 31)),
    },
    buckets: monthBuckets(year, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], false),
    currentKey: toLocalDayKey(new Date(year, month, 1)),
  };
}
