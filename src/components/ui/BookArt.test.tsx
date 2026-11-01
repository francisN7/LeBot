import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { Book } from '@/features/library/types';
import { sizes } from '@/theme';

import { BookArt } from './BookArt';

function book(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    genreId: 'fantasy',
    status: 'reading',
    pages: 310,
    pagesRead: 12,
    isbn: null,
    coverUri: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('BookArt', () => {
  it.each([
    ['lombada compacta', null, true, sizes.spineCompact],
    ['lombada cheia', null, false, sizes.spine],
    ['capa compacta', 'file:///covers/1.jpg', true, sizes.coverCompact],
    ['capa cheia', 'file:///covers/1.jpg', false, sizes.cover],
  ] as const)('%s usa %o', async (_label, coverUri, compact, size) => {
    await render(
      <BookArt
        book={book({ coverUri })}
        compact={compact}
        genreColor="#7B69EE"
        testID="arte"
      />,
    );

    const frame = StyleSheet.flatten(
      screen.getByTestId('arte-frame').props.style,
    );

    expect(frame).toMatchObject({ height: size.height, width: size.width });
  });

  it('a lombada é mais estreita que a capa na mesma altura', async () => {
    expect(sizes.spine.width).toBeLessThan(sizes.cover.width);
    expect(sizes.spineCompact.width).toBeLessThan(sizes.coverCompact.width);
    expect(sizes.spine.height).toBe(sizes.cover.height);
    expect(sizes.spineCompact.height).toBe(sizes.coverCompact.height);
  });
});
