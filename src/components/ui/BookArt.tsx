import { BookCover } from '@/components/ui/BookCover';
import { Spine } from '@/components/ui/Spine';
import type { Book } from '@/features/library/types';
import { hasCover } from '@/lib/covers';
import { sizes } from '@/theme';

type BookArtProps = {
  book: Book;
  genreColor: string;
  /** Compacta (linha de lista) ou no tamanho da estante/detalhe. */
  compact?: boolean;
  onPress?: () => void;
  testID?: string;
};

/**
 * Capa real quando existe, lombada 3D quando não. A Ordem e a tela Hoje
 * mostram o mesmo objeto, então a escolha vive num lugar só.
 *
 * A capa e a lombada têm larguras próprias (a lombada é mais estreita, como um
 * livro fino); a altura do par é a mesma para o card não mudar de tamanho.
 */
export function BookArt({
  book,
  genreColor,
  compact = true,
  onPress,
  testID,
}: BookArtProps) {
  const coverUri = book.coverUri;
  const withCover = hasCover(coverUri);
  const size = withCover
    ? compact
      ? sizes.coverCompact
      : sizes.cover
    : compact
      ? sizes.spineCompact
      : sizes.spine;
  const common = {
    height: size.height,
    onPress,
    status: book.status,
    testID,
    title: book.title,
    width: size.width,
  };

  if (withCover) {
    return <BookCover {...common} genreColor={genreColor} uri={coverUri} />;
  }

  return <Spine {...common} color={genreColor} />;
}
