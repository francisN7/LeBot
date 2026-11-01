import {
  DEFAULT_GOAL_PAGES,
  MAX_GOAL_PAGES,
  MIN_GOAL_PAGES,
} from '@/features/planner';

export { DEFAULT_GOAL_PAGES };

export type GoalInputResult =
  | { ok: true; pages: number }
  | { ok: false; message: string };

/**
 * Valida o campo da meta com o mesmo intervalo do motor (3–200). Não corrige
 * sozinho: valor inválido vira mensagem para o dono decidir.
 */
export function parseGoalInput(value: string): GoalInputResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: false, message: 'Informe a meta em páginas.' };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, message: 'Use só números inteiros.' };
  }

  const pages = Number(trimmed);

  if (!Number.isSafeInteger(pages)) {
    return { ok: false, message: 'Número grande demais.' };
  }

  if (pages < MIN_GOAL_PAGES || pages > MAX_GOAL_PAGES) {
    return {
      ok: false,
      message: `A meta fica entre ${MIN_GOAL_PAGES} e ${MAX_GOAL_PAGES} páginas.`,
    };
  }

  return { ok: true, pages };
}

/** Valor exibido no campo quando a chave ainda não existe ou está corrompida. */
export function goalInputValue(value: string | undefined): string {
  if (value === undefined) {
    return String(DEFAULT_GOAL_PAGES);
  }

  return value;
}
