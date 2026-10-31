/**
 * Contrato de capa: escolher uma imagem, guardar no aparelho e apagar.
 * A implementação nativa vive em `cover-service.ts`; testes injetam um fake.
 */

export type CoverService = {
  /** Abre a galeria e devolve a URI escolhida. */
  pick(): Promise<PickCoverResult>;
  /** Copia a imagem para o aparelho e devolve o caminho salvo. */
  save(bookId: string, sourceUri: string): Promise<string>;
  /** Apaga a capa do disco; ignorar caminho vazio ou ausente. */
  remove(uri: string | null | undefined): Promise<void>;
};

export type PickCoverResult =
  | { status: 'picked'; uri: string }
  | { status: 'canceled' };

/** Pasta das capas dentro de `Paths.document`. */
export const COVERS_DIRECTORY = 'covers';

/** Nome fixo por livro: trocar a capa sobrescreve o mesmo arquivo. */
export function coverFileName(bookId: string): string {
  return `${bookId}.jpg`;
}

/** `true` quando a linha tem capa guardada. */
export function hasCover(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && uri.length > 0;
}
