const MILLISECONDS_PER_DAY = 86_400_000;

/** Dia de calendário como número de dias desde 1970-01-01, no fuso local. */
function localDayNumber(date: Date): number {
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
