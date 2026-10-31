import { sql } from 'drizzle-orm';

import type { TestDatabase } from '@/test-utils/sqlite';
import { createTestDatabase } from '@/test-utils/sqlite';

function insertBook(db: TestDatabase, pages: number, pagesRead: number) {
  db.run(sql`
    INSERT INTO books
      (id, title, author, genre, status, pages, pages_read, created_at, updated_at)
    VALUES
      ('book-x', 'T', 'A', 'fantasy', 'reading', ${pages}, ${pagesRead}, 0, 0)
  `);
}

/** O Drizzle embrulha o erro do SQLite; a mensagem real fica em `cause`. */
function constraintMessage(run: () => void): string {
  try {
    run();
  } catch (error) {
    const cause = (error as { cause?: unknown }).cause;
    return cause instanceof Error ? cause.message : String(error);
  }
  throw new Error('esperava que o SQLite recusasse a inserção');
}

describe('schema', () => {
  it('impede páginas lidas maiores que o total', async () => {
    const db = await createTestDatabase();

    expect(constraintMessage(() => insertBook(db, 10, 11))).toMatch(
      /books_pages_read_range/,
    );
  });

  it('impede livro sem páginas', async () => {
    const db = await createTestDatabase();

    expect(constraintMessage(() => insertBook(db, 0, 0))).toMatch(
      /books_pages_positive/,
    );
  });
});
