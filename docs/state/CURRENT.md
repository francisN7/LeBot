# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter < 80 linhas.

## Sessão

- **Atual:** nenhuma aberta (S3 concluída e validada no Android)
- **Última concluída:** S3 — Biblioteca + ajustes pós-validação
- **Próxima:** S3.2 — gêneros e cores (`docs/sessions/S03.2-generos.md`);
  o par claro/escuro é guardado, mas o tema escuro segue no backlog.

## Pronto (S3)

- Migração `0001_conscious_hannibal_king.sql`: `books.isbn` (único, vários `NULL`) e `books.cover_uri`; tabela não recriada.
- `src/lib/isbn.ts` valida ISBN-10/13 pelo dígito verificador; repositório grava
  normalizado e recusa inválido/duplicado.
- `src/lib/book-search.ts` busca sem acento/caixa (ADR 0009).
- `BookDetailScreen` (`/livro/[id]`): capa ou `Spine`, dados, Editar e Excluir
  com `ConfirmDialog` do app (não mais `Alert`), apagando a capa.
- `BookFormScreen` (`/livro/novo`, `/livro/[id]/editar`): campos (incluindo
  "Páginas lidas"), erro por campo via Zod e capa.
- `CoverService` injetável; capa em `documentDirectory/covers/<id>.jpg`.
- Estante: busca, capa real quando existe, título em linha única fora da
  lombada (corrige "Warbreak/er") e filtro por status.
- Fila: conta só livros existentes e abre o detalhe; toque duplo não empilha
  telas (`src/lib/navigation.ts`).
- `useBooks` tem `create`/`update`/`remove`/`refresh` e avisa as telas com o
  mesmo repositório.
- `BackButton` e `ConfirmDialog` novos em `ui/`; "Voltar" não corta mais a
  última letra.
- 83 testes em 21 suítes; lint, typecheck, doctor e export Android verdes.
- Docs: ADR 0009 + modelo, arquitetura, testes, design system, privacidade e
  CHANGELOG.

## Pendente (dono, no Android)

- Revalidar o último patch (capa na Estante, título em uma linha, diálogo de
  exclusão e "Páginas lidas"); se falhar, corrigir antes da S3.2.

## Decisões abertas

- NativeWind v4 sem suporte oficial à SDK 58 (ADR 0006); se SDK 59 quebrar,
  migrar para NativeWind 5 + Tailwind 4.
- Ícone e splash ainda são placeholders (S4).
- `cover_uri` é absoluto: o backup (S11) decide entre referência e imagem.
- DNF: `brand.md` fala em abandono, schema só tem `reading`, `queued`, `paused`
  e `finished`. Decidir na S9 se vira status próprio.
- ISBN sem hifenização automática (não há tabela de ranges): aceitar dígitos e
  dar feedback de válido/inválido fica na S3.2.
- `brand/source/*.png` têm metadados: limpar no primeiro export real.

## Arquivos-chave

- `src/db/**`, `drizzle/0001_*`, `src/lib/{isbn,book-search,covers,navigation}.ts`
- `src/features/library/*` (telas, `form.ts`, `cover-*`, `use-books.tsx`)
- `src/components/ui/{TextField,ConfirmDialog}.tsx`, `src/app/livro/**`
- `src/test-utils/{render,repositories,covers}.ts(x)`

## Armadilhas

- `expo-env.d.ts` é gerado/ignorado; não apague `types/expo-types.d.ts`.
- Rota nova só tipa depois de gerar `.expo/types/router.d.ts`: rode `npm start`
  (ou regenere com o script do `@expo/router-server`).
- `expo-sqlite`, `expo-file-system` e `expo-image-picker` não rodam no Jest;
  capa entra por contexto, banco por `sql.js`.
- Migração: `schema.ts` → `npx drizzle-kit generate` → commitar `drizzle/`.
- `getDb()` é lazy; chamar no topo de um módulo quebra os testes. `update`
  valida o livro completo; patch sozinho não passa.
- RTL 14 é assíncrono: `await render(...)`, `await fireEvent.press(...)`.
- Fontes: família com peso (`Fredoka_700Bold`), nunca `fontWeight`;
  `lineHeight` abaixo de 1.15× do `fontSize` corta descendentes no Android.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o código.

## Como rodar

```bash
npm install && npm start      # QR code para o Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
```
