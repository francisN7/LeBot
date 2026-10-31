import type { SettingRow } from '../types';

/** Preferências fictícias: nada é persistido até a S2. */
export const settingsRows: SettingRow[] = [
  {
    id: 'goal',
    label: 'Meta diária',
    value: '18 páginas',
    hint: 'O plano diário ajusta a meta conforme o seu ritmo.',
  },
  {
    id: 'reminder',
    label: 'Lembrete',
    value: '20:00',
    hint: 'Um toque no horário, sem cobrança.',
  },
  {
    id: 'appearance',
    label: 'Aparência',
    value: 'Claro',
    hint: 'O tema escuro entra depois do MVP.',
  },
  {
    id: 'backup',
    label: 'Backup',
    value: 'Desligado',
    hint: 'Exportação em JSON chega na S11.',
  },
];
