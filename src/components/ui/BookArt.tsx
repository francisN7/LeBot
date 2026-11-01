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
 */
export function BookArt({
  book,
  genreColor,
  compact = true,
  onPress,
  testID,
}: BookArtProps) {
  const { height, width } = compact ? sizes.spineCompact : sizes.spine;
  const common = {
    height,
    onPress,
    status: book.status,
    testID,
    title: book.title,
    width,
  };

  if (hasCover(book.coverUri)) {
    return (
      <BookCover {...common} genreColor={genreColor} uri={book.coverUri} />
    );
  }

  return <Spine {...common} color={genreColor} showLabel={false} />;
}
