# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter < 80 linhas.

## Sessão

- **Atual:** S3 — Biblioteca (entregue; falta conferir no Android)
- **Última concluída:** S2 — Persistência SQLite + Drizzle (validada pelo dono)
- **Próxima:** S4 — identidade 3D (`docs/sessions/S04-identidade-3d.md`)

## Pronto (S3)

- Migração `0001_conscious_hannibal_king.sql` adiciona `books.isbn` (único,
  vários `NULL`) e `books.cover_uri`; tabela não recriada.
- `src/lib/isbn.ts` valida ISBN-10/13 pelo dígito verificador; repositório
  grava normalizado e recusa inválido/duplicado.
- `src/lib/book-search.ts` busca sem acento/caixa (ADR 0009); Estante combina
  com o chip de status.
- `BookDetailScreen` (`/livro/[id]`): capa ou `Spine`, dados, Editar e Excluir
  com confirmação (apaga a capa).
- `BookFormScreen` (`/livro/novo`, `/livro/[id]/editar`): campos, erro por
  campo via Zod, ISBN e páginas validadas; escolhe/troca/remove capa.
- Capa: galeria → `documentDirectory/covers/<id>.jpg`; só o caminho no banco.
  `CoverService` injetado no `_layout.tsx`; testes usam `createFakeCoverService`.
- `useBooks` expõe `create`, `update`, `remove`, `refresh` e avisa as outras
  telas com o mesmo repositório (assinaturas em `WeakMap`).
- Fila: conta só livros existentes e abre o detalhe; toque duplo não empilha
  telas (`src/lib/navigation.ts`).
- `TextField` novo em `ui/`. Tipografia: `display` 52/64, `xxl` 36/44;
  `typography.test.ts` trava `lineHeight >= fontSize * 1.15`.
- 76 testes em 19 suítes; lint, typecheck, doctor e export Android verdes.

## Pendente (dono, no Android)

- "18 páginas", "Hoje" e "Ajustes" inteiros, sem corte nem sobreposição.
- Cadastrar → aparece na Estante → reabrir o app e continuar lá.
- Buscar por título/autor/ISBN, editar um campo, excluir com confirmação.
- Escolher capa pela galeria e vê-la no detalhe.
- Se tudo passar: marcar S3 `[x]` no roadmap e registrar aqui.

## Decisões abertas

- NativeWind v4 sem suporte oficial à SDK 58 (ADR 0006); se SDK 59 quebrar,
  migrar para NativeWind 5 + Tailwind 4.
- Ícone e splash ainda são placeholders (S4).
- `cover_uri` é caminho absoluto: o backup JSON (S11) precisa decidir se exporta
  a referência ou a imagem.
- DNF: `brand.md` fala em abandono, schema só tem `reading`, `queued`, `paused`
  e `finished`. Decidir na S9 se vira status próprio.
- `brand/source/*.png` têm metadados: limpar no primeiro export real.

## Arquivos-chave

- `src/db/**`, `drizzle/0001_*`, `src/lib/{isbn,book-search,covers}.ts`
- `src/features/library/*` (telas, `form.ts`, `cover-*`, `use-books.tsx`)
- `src/components/ui/TextField.tsx`, `src/app/livro/**`,
  `src/test-utils/{render,repositories,covers}.ts(x)`

## Armadilhas

- `expo-env.d.ts` é gerado/ignorado; não apague `types/expo-types.d.ts`.
- Rota nova só tipa depois de gerar `.expo/types/router.d.ts`: rode `npm start`
  (ou regenere com o script do `@expo/router-server`).
- `expo-sqlite`, `expo-file-system` e `expo-image-picker` não rodam no Jest;
  capa entra por contexto, banco por `sql.js`.
- Migração: editar `schema.ts` → `npx drizzle-kit generate` → commitar
  `drizzle/`; nunca editar migração já aplicada.
- `getDb()` é lazy; chamar no topo de um módulo quebra os testes. `update`
  valida o livro completo; patch sozinho não passa.
- RTL 14 é assíncrono: `await render(...)`, `await fireEvent.press(...)`.
- Fontes: família com peso (`Fredoka_700Bold`), nunca `fontWeight`.
- `lineHeight` abaixo de 1.15× do `fontSize` corta descendentes no Android.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o código.

## Como rodar

```bash
npm install && npm start      # QR code para o Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
