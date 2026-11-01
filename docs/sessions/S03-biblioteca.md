# S03 — Biblioteca: cadastrar, buscar e editar

## Objetivo

Fechar o ciclo do livro na UI: cadastrar, encontrar e editar um livro gravando
no SQLite, com ISBN e capa escolhida da galeria.

## Fora de escopo

- Consulta online de ISBN (Open Library/Google Books) e OCR: ficam no backlog
  por privacidade e por não bloquear o fluxo manual.
- Lombada 3D e identidade visual definitiva (S4).
- Registro de leitura e progresso automático (S5).
- Exclusão em massa, importação e backup (S11).

## Correções trazidas da S2 (fazer primeiro)

1. Corrigir o corte de descendentes em `AppText variant="display"`
   (`src/theme/typography.ts`): `fontSize.display = 52` com
   `lineHeight.display = 56` corta `p`, `g` e `J` no Android e faz a linha
   seguinte sobrepor. Dar folga (~15–20%) e revisar `xxl` (36/42) pelo mesmo
   motivo. Não usar `paddingBottom` como gambiarra: corrigir o token.
2. Teste de regressão em `src/theme/typography.test.ts`: garantir
   `lineHeight >= fontSize * 1.15` para `display`, `xxl` e `xl`.
3. Conferir no Android (aba Hoje e títulos Estante/Fila/Ajustes) que "18
   páginas", "Hoje" e "Ajustes" aparecem inteiros e sem sobreposição.

## Tarefas

1. Migração `0001`: adicionar `isbn` (text, nullable, único quando presente) e
   `cover_uri` (text, nullable) em `books`; regenerar com `drizzle-kit` e
   commitar `drizzle/`.
2. Estender schema, `CreateBookInput` e repositório; validar ISBN-10/ISBN-13
   (dígito verificador) em `src/lib/isbn.ts`, com testes.
3. Tela de detalhe `src/features/library/BookDetailScreen.tsx` + rota
   `src/app/livro/[id].tsx`: dados do livro, capa (ou `Spine` por gênero),
   ações Editar e Excluir (com confirmação).
4. Tela de formulário `src/features/library/BookFormScreen.tsx` + rotas
   `src/app/livro/novo.tsx` e `src/app/livro/[id]/editar.tsx`: campos título,
   autor, gênero, status, páginas, ISBN; validação com Zod e erros por campo.
5. Capa: `expo-image-picker` (galeria) → copiar para
   `FileSystem.documentDirectory/covers/<id>.jpg`; guardar só o caminho no
   banco. Remover arquivo ao trocar ou excluir o livro.
6. Busca na Estante: filtro por texto (título/autor/ISBN) junto dos chips de
   status, sem SQL na tela (repositório ganha `search` ou a tela filtra a lista
   já carregada — decidir e registrar).
7. Ajustar `useBooks` para expor `create`, `update`, `remove` e recarregar;
   manter o padrão de repositório injetável nos testes.
8. Testes: `isbn` (válidos/inválidos), repositório `search`/campos novos,
   formulário (salvar cria e edita), detalhe (exclui com confirmação), Estante
   (busca). Cobrir caminho de erro de validação.
9. Atualizar `docs/data-model.md`, `docs/architecture.md`, `docs/testing.md`,
   `docs/INDEX.md` e `CHANGELOG.md`.

## Aceite

- [x] Títulos e textos `display` sem corte de descendentes no Android.
- [x] Cadastrar livro pela UI → aparece na Estante e sobrevive ao reiniciar.
- [x] Buscar por título, autor ou ISBN encontra o livro.
- [x] Editar qualquer campo persiste a mudança e atualiza `updated_at`.
- [x] Excluir pede confirmação, remove capa do disco e some da Estante/Fila.
- [x] ISBN inválido bloqueia o salvar com mensagem clara.
- [x] Nenhum SQL fora de `src/db/`; nenhum `any`.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run doctor`
      verdes; `expo export --platform android` conclui.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/data-model.md`,
`docs/architecture.md`, `docs/design/design-system.md`, `docs/security-privacy.md`,
`src/db/`, `src/features/library/`.

## Arquivos prováveis

`src/db/schema.ts`, `drizzle/0001_*.sql`, `src/db/repositories/books.ts`,
`src/lib/isbn.ts`, `src/features/library/{BookFormScreen,BookDetailScreen}.tsx`,
`src/features/library/use-books.tsx`, `src/app/livro/*`, `app.config.ts`.

## Riscos

- **Tipografia:** o corte de descendentes só aparece no Android; validar no
  device, não só no teste de token. Se aumentar `lineHeight` demais, os
  cartões da Estante ficam altos — conferir visual.
- **Migração aditiva:** nunca recriar a tabela. Conferir `drizzle-kit generate`
  antes de commitar e rodar `npm run test` (as migrações reais rodam no `sql.js`).
- **Arquivos de capa órfãos:** copiar/remover precisa ser testável sem módulo
  nativo; isolar `src/lib/covers.ts` e injetar no teste.
- **Permissões:** `expo-image-picker` exige permissão de galeria; recusar não
  pode travar o formulário — o livro salva sem capa.
- **Paths de rota:** `[id]` e `novo` convivem; conferir no Expo Go e cobrir
  redirect de id inexistente.
- **Privacidade:** capa e ISBN ficam só no aparelho; sem upload e sem chamada de
  API. Dados do seed continuam fictícios.
- **Node local 26 vs CI 22:** rodar `npm run test` antes de culpar o código.
