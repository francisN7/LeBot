import { daysBetween } from '@/lib/day';

import type { StatsInsight } from './types';

export type InsightInput = {
  pages: number;
  previousPages: number;
  activeDays: number;
  averagePerActiveDay: number;
  streak: number;
  finishedCount: number;
  /** Gênero com mais páginas e a fatia dele no período (0–1). */
  topGenre: { name: string; share: number } | null;
  averageRating: number | null;
  ratingCount: number;
  lastReadAt: Date | null;
  today: Date;
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

function decimal(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

/**
 * Uma frase por tela, escolhida por prioridade. O tom é descritivo: nada de
 * "você falhou" ou metas não cumpridas. Regras puras e determinísticas.
 */
export function buildInsight(input: InsightInput): StatsInsight {
  const {
    pages,
    previousPages,
    activeDays,
    averagePerActiveDay,
    streak,
    finishedCount,
    topGenre,
    averageRating,
    ratingCount,
    lastReadAt,
    today,
  } = input;

  if (pages === 0 && finishedCount === 0) {
    return {
      text: 'Ainda não tem páginas neste período — o diário começa quando você lê.',
      mood: 'thinking',
    };
  }

  if (streak >= 3) {
    return {
      text: `Sequência de ${streak} dias. O LêBot está orgulhoso.`,
      mood: 'celebrating',
    };
  }

  if (finishedCount > 0) {
    return {
      text: `${plural(finishedCount, 'livro concluído', 'livros concluídos')} no período. A estante cresceu.`,
      mood: 'celebrating',
    };
  }

  if (topGenre && topGenre.share >= 0.5 && pages >= 50) {
    return {
      text: `${topGenre.name} puxa ${Math.round(topGenre.share * 100)}% das suas páginas neste período.`,
      mood: 'reading',
    };
  }

  if (previousPages > 0) {
    const change = (pages - previousPages) / previousPages;

    if (change >= 0.25) {
      return {
        text: `${Math.round(change * 100)}% mais páginas que no período anterior.`,
        mood: 'reading',
      };
    }
  }

  if (averageRating !== null && ratingCount >= 2) {
    return {
      text: `Sua nota média é ${decimal(averageRating)} em ${plural(ratingCount, 'resenha', 'resenhas')}.`,
      mood: 'happy',
    };
  }

  if (activeDays >= 5) {
    return {
      text: `Você leu em ${activeDays} dias do período — ${averagePerActiveDay} páginas por dia ativo.`,
      mood: 'reading',
    };
  }

  if (lastReadAt && daysBetween(lastReadAt, today) > 7) {
    return {
      text: 'O diário está aberto, esperando a próxima página.',
      mood: 'sleepy',
    };
  }

  if (activeDays < 3) {
    return {
      text: 'Poucas páginas ainda — o LêBot está juntando o diário.',
      mood: 'thinking',
    };
  }

  return {
    text: `${pages} páginas neste período. Cada uma conta.`,
    mood: 'reading',
  };
}
