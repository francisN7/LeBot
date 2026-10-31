import type { SettingRow } from './types';

export type SettingRowDefinition = {
  id: string;
  key: string;
  label: string;
  hint: string;
  format: (value: string | undefined) => string;
};

/**
 * Como cada preferência aparece na tela. Os valores vivem em `settings`;
 * aqui ficam só rótulos, dicas e formatação.
 */
export const settingRowDefinitions: SettingRowDefinition[] = [
  {
    id: 'goal',
    key: 'goal.pages',
    label: 'Meta diária',
    hint: 'O plano diário ajusta a meta conforme o seu ritmo.',
    format: (value) => `${value ?? '18'} páginas`,
  },
  {
    id: 'reminder',
    key: 'reminder.time',
    label: 'Lembrete',
    hint: 'Um toque no horário, sem cobrança.',
    format: (value) => value ?? '20:00',
  },
  {
    id: 'appearance',
    key: 'appearance.theme',
    label: 'Aparência',
    hint: 'O tema escuro entra depois do MVP.',
    format: (value) => (value === 'dark' ? 'Escuro' : 'Claro'),
  },
  {
    id: 'backup',
    key: 'backup.enabled',
    label: 'Backup',
    hint: 'Exportação em JSON chega na S11.',
    format: (value) => (value === 'true' ? 'Ligado' : 'Desligado'),
  },
];

export function toSettingRows(values: Record<string, string>): SettingRow[] {
  return settingRowDefinitions.map((definition) => ({
    id: definition.id,
    label: definition.label,
    value: definition.format(values[definition.key]),
    hint: definition.hint,
  }));
}
