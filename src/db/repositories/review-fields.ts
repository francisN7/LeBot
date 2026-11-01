import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { createId } from '@/lib/id';

import { type ReviewFieldRow, reviewFields } from '../schema';
import type { AppDatabase } from '../types';
import { stripFieldFromExtras } from './reviews';

export const DUPLICATE_REVIEW_FIELD = 'Já existe um campo com este nome';
export const FIELD_NAME_MAX = 40;

const fieldName = z
  .string()
  .trim()
  .min(1, 'Dê um nome ao campo')
  .max(FIELD_NAME_MAX, `Use até ${FIELD_NAME_MAX} caracteres`);

export const reviewFieldInputSchema = z.object({ name: fieldName });

export type CreateReviewFieldInput = z.input<typeof reviewFieldInputSchema>;

export type ReviewFieldsRepository = {
  list(): ReviewFieldRow[];
  findById(id: string): ReviewFieldRow | undefined;
  create(input: CreateReviewFieldInput): ReviewFieldRow;
  rename(id: string, name: string): ReviewFieldRow | undefined;
  /** Apaga o campo e limpa a chave dele nas resenhas. */
  remove(id: string): boolean;
};

/** Compara nomes sem caixa e sem espaços repetidos, para evitar duplicata. */
export function normalizeReviewFieldName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function createReviewFieldsRepository<TRunResult>(
  db: AppDatabase<TRunResult>,
): ReviewFieldsRepository {
  function findByName(
    name: string,
    exceptId?: string,
  ): ReviewFieldRow | undefined {
    const wanted = normalizeReviewFieldName(name);

    return db
      .select()
      .from(reviewFields)
      .all()
      .find(
        (field) =>
          field.id !== exceptId &&
          normalizeReviewFieldName(field.name) === wanted,
      );
  }

  const repository: ReviewFieldsRepository = {
    list() {
      return db
        .select()
        .from(reviewFields)
        .orderBy(reviewFields.sortOrder, reviewFields.name)
        .all();
    },

    findById(id) {
      return db
        .select()
        .from(reviewFields)
        .where(eq(reviewFields.id, id))
        .get();
    },

    create(input) {
      const name = cleanName(reviewFieldInputSchema.parse(input).name);

      if (findByName(name)) {
        throw new Error(DUPLICATE_REVIEW_FIELD);
      }

      const last = repository.list().at(-1);
      const now = new Date();
      const row: ReviewFieldRow = {
        id: createId('field'),
        name,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      };

      db.insert(reviewFields).values(row).run();
      return row;
    },

    rename(id, rawName) {
      const current = repository.findById(id);

      if (!current) {
        return undefined;
      }

      const name = cleanName(
        reviewFieldInputSchema.parse({ name: rawName }).name,
      );

      if (findByName(name, id)) {
        throw new Error(DUPLICATE_REVIEW_FIELD);
      }

      return db
        .update(reviewFields)
        .set({ name, updatedAt: new Date() })
        .where(eq(reviewFields.id, id))
        .returning()
        .get();
    },

    remove(id) {
      const deleted = db
        .delete(reviewFields)
        .where(eq(reviewFields.id, id))
        .returning({ id: reviewFields.id })
        .all();

      if (deleted.length === 0) {
        return false;
      }

      stripFieldFromExtras(db, id);
      return true;
    },
  };

  return repository;
}
