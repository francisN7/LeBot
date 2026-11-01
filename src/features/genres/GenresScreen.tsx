import { Pressable, View } from 'react-native';

import {
  AppText,
  BackButton,
  Button,
  Card,
  Chip,
  Screen,
} from '@/components/ui';
import { useBooks } from '@/features/library/use-books';
import { resolveGenreColor, sizes } from '@/theme';

import type { Genre } from './types';
import { useGenres } from './use-genres';

type GenresScreenProps = {
  onBack: () => void;
  onCreate: () => void;
  onOpenGenre: (genreId: string) => void;
};

function bookCountLabel(count: number): string {
  if (count === 0) {
    return 'Nenhum livro ainda';
  }

  return count === 1 ? '1 livro' : `${count} livros`;
}

/** Ajustes → Gêneros: lista com a cor e quantos livros usam cada gênero. */
export function GenresScreen({
  onBack,
  onCreate,
  onOpenGenre,
}: GenresScreenProps) {
  const { genres } = useGenres();
  const { books } = useBooks();

  function countOf(genre: Genre): number {
    return books.filter((book) => book.genreId === genre.id).length;
  }

  return (
    <Screen>
      <BackButton onPress={onBack} />

      <View className="gap-xs">
        <AppText variant="display">Gêneros</AppText>
        <AppText tone="muted">
          Nome e cor de cada prateleira. A cor vale no tema claro e no escuro.
        </AppText>
      </View>

      <Button label="Novo gênero" onPress={onCreate} size="sm" />

      <View className="gap-sm">
        {genres.map((genre) => (
          <Pressable
            accessibilityLabel={`Editar gênero ${genre.name}`}
            accessibilityRole="button"
            className="active:opacity-80"
            key={genre.id}
            onPress={() => onOpenGenre(genre.id)}
          >
            <Card className="flex-row items-center gap-md">
              <View
                className="overflow-hidden rounded-md border-2 border-navy"
                style={sizes.genreSwatch}
                testID={`genre-swatch-${genre.id}`}
              >
                <View
                  className="flex-1"
                  style={{ backgroundColor: resolveGenreColor(genre) }}
                />
                <View
                  className="flex-1"
                  style={{ backgroundColor: resolveGenreColor(genre, 'dark') }}
                />
              </View>
              <View className="flex-1 gap-xs">
                <AppText numberOfLines={1} variant="bodyStrong">
                  {genre.name}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {bookCountLabel(countOf(genre))}
                </AppText>
              </View>
              {genre.isDefault ? <Chip label="Padrão" /> : null}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
