# ADR 0009 — Biblioteca: busca em memória e capas no aparelho

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S3

## Contexto

A S3 trouxe cadastro, busca, edição e exclusão de livros, com ISBN e capa
escolhida da galeria. Duas escolhas precisavam de decisão explícita:

1. **Onde a busca acontece.** A spec permitia `search` no repositório (SQL) ou
   filtro da lista já carregada na tela.
2. **Onde a capa vive.** Guardar a imagem no SQLite, num diretório do aparelho
   ou fazer upload.

## Decisão

### Busca: filtro em memória

- `src/lib/book-search.ts` expõe `matchesQuery` (campos × termo) e
  `normalizeText` (minúsculas, sem acento, sem espaços nas pontas).
- A Estante filtra a lista que o `useBooks` já carregou, combinando o termo com
  o chip de status.
- Motivos: a estante de um aparelho tem dezenas de livros (não milhares);
  `LIKE` do SQLite é sensível a acento, e o banco guardaria "Príncipe" sem casar
  com "principe"; o filtro puro roda no Node sem `sql.js`.
- Se o volume crescer (importação em massa, S11), a busca migra para o
  repositório com uma coluna normalizada — o contrato do repositório não muda
  para a tela.

### Capa: arquivo local com serviço injetável

- A galeria (`expo-image-picker`) devolve uma URI temporária. O app copia a
  imagem para `documentDirectory/covers/<id>.jpg` com `expo-file-system` e
  grava **só o caminho** em `books.cover_uri`.
- O contrato `CoverService` (escolher, salvar, remover) vive em
  `src/lib/covers.ts`. A implementação nativa fica em
  `src/features/library/cover-service.ts` e só é montada no `_layout.tsx`,
  dentro de `CoverServiceProvider`; as telas nunca importam
  `expo-image-picker`/`expo-file-system`.
- Testes injetam `createFakeCoverService` (`src/test-utils/covers.ts`).
- Nome fixo por livro: trocar a capa sobrescreve o mesmo arquivo, então não
  existe capa órfã da versão anterior. Se o livro não for gravado, o arquivo
  recém-copiado é apagado.
- Excluir o livro apaga a capa antes de remover a linha; falha ao apagar o
  arquivo não impede a exclusão (arquivo órfão é menos grave que dado preso).

## Consequências

- Busca ignora acento e caixa, com teste unitário rápido.
- Nada de imagem no banco: migração e backup (S11) continuam pequenos, mas o
  export JSON precisará decidir o que fazer com `cover_uri` (caminho de outro
  aparelho não vale).
- Cópias de capa não entram em backup automático do sistema garantidamente; se
  o arquivo sumir, a UI cai na lombada por gênero.
- Nenhuma chamada de rede: ISBN e capa ficam no aparelho.

## Alternativas descartadas

- **`search` no SQL com `LIKE`:** não casa acento e exigiria normalizar na
  gravação; sem ganho para o volume atual.
- **Capa em base64 no SQLite:** infla o banco, atrapalha backup e não é o que
  o `Image` espera.
- **Upload para storage:** contraria a promessa de dados só no aparelho.
- **Permissão de galeria obrigatória:** a seleção usa o picker do sistema, que
  não exige permissão; recusar/errar a galeria não bloqueia o salvamento sem
  capa.
