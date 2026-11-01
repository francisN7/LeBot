import { z } from 'zod';
import type { CreateBookInput } from '@/db/repositories';
import { readingStatuses } from '@/db/schema';
import { isValidIsbn, toStoredIsbn } from '@/lib/isbn';

import type { ReadingStatus } from './types';

/** O formulário guarda tudo como texto; a conversão acontece na validação. */
export type BookFormState = {
  title: string;
  author: string;
  genreId: string;
  status: ReadingStatus;
  pages: string;
  pagesRead: string;
  isbn: string;
};

export type BookFormErrors = Partial<
  Record<'title' | 'author' | 'pages' | 'pagesRead' | 'isbn', string>
>;

export type BookFormResult =
  | { ok: true; input: Omit<CreateBookInput, 'id'> }
  | { ok: false; errors: BookFormErrors };

export const emptyBookForm: BookFormState = {
  title: '',
  author: '',
  genreId: '',
  status: 'queued',
  pages: '',
  pagesRead: '0',
  isbn: '',
};

const bookFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título'),
  author: z.string().trim().min(1, 'Informe o autor'),
  genreId: z.string().trim().min(1, 'Escolha um gênero'),
  status: z.enum(readingStatuses),
  pages: z
    .string()
    .trim()
    .min(1, 'Informe o total de páginas')
    .regex(/^\d+$/, 'Use apenas números')
    .transform(Number)
    .refine((value) => value > 0, 'O livro precisa ter ao menos 1 página'),
  pagesRead: z
    .string()
    .trim()
    .regex(/^\d*$/, 'Use apenas números')
    .transform((value) => (value.length === 0 ? 0 : Number(value))),
  isbn: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || isValidIsbn(value),
      'ISBN inválido',
    ),
});

const fieldsWithErrors = [
  'title',
  'author',
  'pages',
  'pagesRead',
  'isbn',
] as const;

/** Valida o formulário e devolve o input do repositório ou erros por campo. */
export function validateBookForm(
  state: BookFormState,
  coverUri: string | null,
  /** Páginas que as sessões já registradas colocaram no progresso. */
  recordedPages = 0,
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

  if (parsed.data.pagesRead > parsed.data.pages) {
    return {
      ok: false,
      errors: {
        pagesRead: 'As páginas lidas não podem passar do total',
      },
    };
  }

  if (parsed.data.pagesRead < recordedPages) {
    return {
      ok: false,
      errors: {
        pagesRead: `Há ${recordedPages} páginas registradas nas sessões. Desfaça no detalhe para reduzir.`,
      },
    };
  }

  return {
    ok: true,
    input: {
      title: parsed.data.title,
      author: parsed.data.author,
      genreId: parsed.data.genreId,
      status: parsed.data.status,
      pages: parsed.data.pages,
      pagesRead: parsed.data.pagesRead,
      isbn: toStoredIsbn(parsed.data.isbn),
      coverUri,
    },
  };
}
