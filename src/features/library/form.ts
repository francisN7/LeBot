import { z } from 'zod';
import type { CreateBookInput } from '@/db/repositories';
import { bookGenres, readingStatuses } from '@/db/schema';
import { isValidIsbn, toStoredIsbn } from '@/lib/isbn';

import type { BookGenre, ReadingStatus } from './types';

/** O formulário guarda tudo como texto; a conversão acontece na validação. */
export type BookFormState = {
  title: string;
  author: string;
  genre: BookGenre;
  status: ReadingStatus;
  pages: string;
  isbn: string;
};

export type BookFormErrors = Partial<
  Record<'title' | 'author' | 'pages' | 'isbn', string>
>;

export type BookFormResult =
  | { ok: true; input: Omit<CreateBookInput, 'id'> }
  | { ok: false; errors: BookFormErrors };

export const emptyBookForm: BookFormState = {
  title: '',
  author: '',
  genre: 'fantasy',
  status: 'queued',
  pages: '',
  isbn: '',
};

const bookFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título'),
  author: z.string().trim().min(1, 'Informe o autor'),
  genre: z.enum(bookGenres),
  status: z.enum(readingStatuses),
  pages: z
    .string()
    .trim()
    .min(1, 'Informe o total de páginas')
    .regex(/^\d+$/, 'Use apenas números')
    .transform(Number)
    .refine((value) => value > 0, 'O livro precisa ter ao menos 1 página'),
  isbn: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || isValidIsbn(value),
      'ISBN inválido',
    ),
});

const fieldsWithErrors = ['title', 'author', 'pages', 'isbn'] as const;

/** Valida o formulário e devolve o input do repositório ou erros por campo. */
export function validateBookForm(
  state: BookFormState,
  coverUri: string | null,
): BookFormResult {
  const parsed = bookFormSchema.safeParse(state);

  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    const errors: BookFormErrors = {};

    for (const field of fieldsWithErrors) {
      const message = fieldErrors[field]?.[0];

      if (message) {
        errors[field] = message;
      }
    }

    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      title: parsed.data.title,
      author: parsed.data.author,
      genre: parsed.data.genre,
      status: parsed.data.status,
      pages: parsed.data.pages,
      isbn: toStoredIsbn(parsed.data.isbn),
      coverUri,
    },
  };
}
