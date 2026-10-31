import { sql } from 'drizzle-orm';

import { createBooksRepository } from '@/db/repositories/books';
import { createGenresRepository } from '@/db/repositories/genres';
import { defaultGenreIds } from '@/db/schema';
import { createTestDatabase, runMigrations } from '@/test-utils/sqlite';

function insertLegacyBook(db: Awaited<ReturnType<typeof createTestDatabase>>) {
  db.run(sql`
    INSERT INTO books
      (id, title, author, genre, status, pages, pages_read, created_at, updated_at)
    VALUES
      ('book-legado', 'Livro antigo', 'Autora', 'fantasy', 'reading', 120, 10, 0, 0)
  `);
}

describe('migração 0002 (gêneros)', () => {
  it('insere os 6 gêneros de fábrica', async () => {
    const db = await createTestDatabase();
    const genres = createGenresRepository(db).list();

    expect(genres.map((genre) => genre.id)).toEqual([...defaultGenreIds]);
    expect(genres.every((genre) => genre.isDefault)).toBe(true);
  });

  it('mantém o gênero dos livros antigos legível', async () => {
    const db = await createTestDatabase();
    insertLegacyBook(db);

    // Rodar de novo não recria a tabela nem mexe nas linhas de `books`.
    runMigrations(db);

    const books = createBooksRepository(db).list();
    expect(books).toHaveLength(1);
    expect(books[0]?.genreId).toBe('fantasy');
    expect(books[0]?.title).toBe('Livro antigo');
  });
});
