/** Limites da meta configurada (`settings.goal.pages`). */
export const MIN_GOAL_PAGES = 3;
export const MAX_GOAL_PAGES = 200;

/** Valor usado quando a meta ainda não existe em `settings`. */
export const DEFAULT_GOAL_PAGES = 18;

/** Um livro `reading` continua ativo enquanto a última sessão tem < 7 dias. */
export const ACTIVE_WINDOW_DAYS = 7;

/** Sem sessão há 3+ dias, o dia é "volta leve". */
export const LIGHT_DAY_AFTER_DAYS = 3;
export const LIGHT_DAY_PERCENT = 70;

/** O teto de 60% só vale a partir desta meta. */
export const CAP_MIN_GOAL_PAGES = 10;
export const ACTIVE_BOOK_CAP_PERCENT = 60;

/** Arredondamento: fração > 0,7 sobe; o resto desce. */
export const ROUND_UP_ABOVE_PERCENT = 70;
