/**
 * Gera um id local, sem depender de `crypto.randomUUID` (ausente em alguns
 * motores JS). Colisão é improvável o bastante para dados de um aparelho.
 */
export function createId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${time}-${random}`;
}
