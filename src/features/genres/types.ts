import type { GenreRow } from '@/db/schema';

/** Gênero como a UI enxerga: sem timestamps. */
export type Genre = {
  id: string;
  name: string;
  colorLight: string;
  colorDark: string;
  /** `null` quando a cor é personalizada. */
  paletteIndex: number | null;
  isDefault: boolean;
  sortOrder: number;
};

export function toGenre(row: GenreRow): Genre {
  return {
    id: row.id,
    name: row.name,
    colorLight: row.colorLight,
    colorDark: row.colorDark,
    paletteIndex: row.paletteIndex,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
  };
}
