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
