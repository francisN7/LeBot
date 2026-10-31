/**
 * Cor de gênero: hex, contraste e validação do par claro/escuro.
 * Tudo puro — o formulário usa para dar erro por campo e o tema usa para
 * verificar a paleta.
 */

/** Aceita `#RRGGBB` com ou sem `#`; devolve sempre `#RRGGBB` em maiúsculo. */
export function normalizeHexColor(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

const HEX_PATTERN = /^#[0-9A-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(normalizeHexColor(value));
}

function channel(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa (WCAG) de um hex válido. */
export function relativeLuminance(hex: string): number {
  const normalized = normalizeHexColor(hex);
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

/** Razão de contraste entre duas cores (1:1 a 21:1). */
export function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));

  return (lighter + 0.05) / (darker + 0.05);
}

/** Contraste mínimo para formas que precisam se destacar do fundo. */
export const MIN_CONTRAST = 3;

export type ColorPairErrors = Partial<Record<'light' | 'dark', string>>;

export type ColorPairResult =
  | { ok: true; light: string; dark: string }
  | { ok: false; errors: ColorPairErrors };

/**
 * Valida o par do formulário: cada hex precisa ser `#RRGGBB` e os dois não
 * podem ser iguais (o par escuro existe para mudar a cor no tema escuro).
 */
export function validateColorPair(
  light: string,
  dark: string,
): ColorPairResult {
  const errors: ColorPairErrors = {};
  const normalizedLight = normalizeHexColor(light);
  const normalizedDark = normalizeHexColor(dark);

  if (!isHexColor(light)) {
    errors.light = 'Use um hex como #7B69EE';
  }

  if (!isHexColor(dark)) {
    errors.dark = 'Use um hex como #B3A7FF';
  }

  if (!errors.light && !errors.dark && normalizedLight === normalizedDark) {
    errors.dark = 'O par escuro precisa ser diferente do claro';
  }

  if (errors.light || errors.dark) {
    return { ok: false, errors };
  }

  return { ok: true, light: normalizedLight, dark: normalizedDark };
}

/**
 * Aviso (não bloqueio) para cor personalizada: abaixo de 3:1 contra o navy a
 * lombada e a fita podem sumir no fundo creme.
 */
export function isLowContrast(color: string, reference: string): boolean {
  return contrastRatio(color, reference) < MIN_CONTRAST;
}
