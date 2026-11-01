const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Dia de calendário como número de dias desde 1970-01-01, no fuso local.
 * Comparar dias assim evita o erro clássico de agrupar timestamps em UTC.
 */
export function localDayNumber(date: Date): number {
  const midnightUtc = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return Math.floor(midnightUtc / MILLISECONDS_PER_DAY);
}

/** Diferença em dias de calendário; positiva quando `to` vem depois de `from`. */
export function daysBetween(from: Date, to: Date): number {
  return localDayNumber(to) - localDayNumber(from);
}

/** Dia local no formato `YYYY-MM-DD`, sem depender do locale do aparelho. */
export function toLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Meia-noite local do dia. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Último milissegundo do dia local. */
export function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

/** Soma dias de calendário preservando o horário (some em volta do horário de verão). */
export function addLocalDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}
