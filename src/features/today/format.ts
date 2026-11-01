const weekdayNames = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

const monthNames = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

/** Data da tela Hoje em PT-BR, sem depender do locale do aparelho. */
export function formatTodayLabel(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${weekdayNames[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]}`;
}

/** Hora local da sessão em `HH:mm`, sem depender do locale do aparelho. */
export function formatReadTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
