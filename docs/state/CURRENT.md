# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter < 80 linhas.

## Sessão
- **Atual:** S3 — Biblioteca: cadastrar, buscar e editar (`docs/sessions/S03-biblioteca.md`)
- **Última concluída:** S2 — Persistência SQLite + Drizzle (`0209f04`, validada no Android pelo dono)
- **Próxima:** S3 — começar corrigindo o corte de descendentes na tipografia `display`

## Pronto
- SQLite real no aparelho: `expo-sqlite` 58.0.15 + `drizzle-orm` 0.45.4,
  `drizzle-kit` 0.31.11 e migração `drizzle/0000_aspiring_unicorn.sql`.
- `src/db/schema.ts`: `books` (id, title, author, genre, status, pages,
  pages_read, created_at, updated_at, 2 CHECKs) e `settings` (key, value).
- `src/db/client.ts`: abertura lazy, `PRAGMA journal_mode = WAL` e
  `foreign_keys = ON`; `getDb()` reaproveita a instância.
- Boot em `src/app/_layout.tsx`: fontes → banco → `useMigrations` → seed →
  splash; falha de banco/migração mostra `DatabaseError` em tela.
- Repositórios em `src/db/repositories/` (`books`: list/findById/create/update/
  remove; `settings`: get/all/set/remove), com Zod e merge na validação do
  `update`. SQL só dentro de `src/db/`.
- Seed de 5 livros fictícios + 4 preferências, só em banco vazio e uma vez
  (`seed.books.version`); não repõe livros apagados.
- Hooks `useBooks` e `useSettings` com repositório injetável por contexto;
  Estante, Fila e Ajustes leem do banco; Hoje usa `goal.pages` de `settings`
  (blocos ainda são fixture até S6/S7).
- Fixtures de livros e de settings removidas; sobram `queue` e `daily-plan`.
- 29 testes em 11 suítes: CRUD, constraints, seed idempotente, migração
  repetida e as 4 telas com repositórios em memória.
- CI: typecheck passou a encontrar `*.css` no runner — `expo-env.d.ts` é
  gitignored, então `types/expo-types.d.ts` referencia `expo/types` e fica
  versionado. O commit `9e650d8` falhava só nisso.
- Docs: `docs/data-model.md`, `docs/testing.md`, `docs/architecture.md`,
  `docs/INDEX.md`, ADR 0007 e 0008.
- Conferido no Android pelo dono: seed mostra 5 livros e eles continuam após
  fechar/reabrir o app (aceite da S2 fechado).

## Bug conhecido (corrigir no início da S3)
- `AppText variant="display"` corta descendentes (`p`, `g`, `J`) no Android:
  "18 páginas", "Hoje" e "Ajustes" aparecem com a base cortada e o texto
  seguinte ("cerca de 15 minutos de leitura") sobrepõe a linha.
- Causa provável: `lineHeight.display = 56` para `fontSize.display = 52`
  (Fredoka 700) — a caixa de linha é menor que as métricas da fonte.
  Conferir também `xxl` (36/42). Ver tarefas 1–2 da spec S3.

## Próximo passo
Executar a S3 na ordem: corrigir tipografia `display` e validar no Android,
depois migração 0001 (`isbn`, `cover_uri`), formulário/detalhe, busca e capa.

## Pendências manuais (dono)
- ~~Fechar os 7 PRs antigos do Dependabot~~ feito.
- ~~Ligar Dependabot alerts/security updates, secret scanning e push
  protection~~ feito.
- ~~Ruleset na `main` (restrict deletions + block force pushes)~~ feito.
- ~~Rodar no Android e confirmar que o seed aparece e sobrevive ao fechar o
  app~~ feito: permanecem 5 livros após reabrir.

## Decisões abertas
- NativeWind v4 não declara suporte oficial à SDK 58 (ADR 0006): bundle passou;
  se SDK 59 quebrar, migrar para NativeWind 5 + Tailwind 4.
- Ícone e splash ainda são placeholders do template (S4).
- Migração em device: WAL/arquivo não são cobertos pelo `sql.js`; validar no
  Android a cada mudança de schema.
- `docs/brand.md` fala em DNF/abandono, mas o schema só tem `reading`, `queued`,
  `paused` e `finished`. Decidir na S9 se abandono vira status próprio ou é
  `paused`.
- `brand/source/*.png` ainda têm metadados: limpar no primeiro export real.

## Arquivos-chave
- `src/db/{schema,client,seed,types}.ts`, `src/db/repositories/*`
- `drizzle.config.ts`, `drizzle/` (migração + `migrations.js`)
- `src/app/_layout.tsx`, `babel.config.js`, `metro.config.js`, `app.config.ts`
- `src/features/library/{use-books.tsx,EstanteScreen.tsx}`
- `src/features/settings/{use-settings.tsx,rows.ts}`
- `src/test-utils/{render.tsx,repositories.ts,sqlite.ts}`
- `types/expo-types.d.ts`, `types/sql.d.ts`

## Armadilhas
- `expo-env.d.ts` é gerado e ignorado; não apague `types/expo-types.d.ts` ou o
  CI quebra no `global.css`.
- Migração nova: editar `schema.ts` → `npx drizzle-kit generate` → commitar
  `drizzle/`. Nunca editar migração já aplicada.
- `.sql` só é importado por causa do `inline-import` no Babel e de `sql` em
  `metro.config.js.sourceExts`.
- `expo-sqlite` não roda no Jest: teste de repositório usa `sql.js`; teste de
  tela injeta repositório em memória.
- `getDb()` é lazy de propósito; chamar no topo de um módulo quebra os testes.
- `update` valida o livro completo — patch sozinho não passa validação.
- RTL 14 é assíncrono: `await render(...)` e `await fireEvent.press(...)`.
- Fontes: use a família com peso (`Fredoka_700Bold`), nunca `fontWeight`.
- Texto grande no Android corta descendentes quando `lineHeight` fica próximo
  do `fontSize`: variante `display` (52/56) já apresentou o bug. Dê folga de
  ~15–20% e valide no device.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o código.
- `npx expo install <pkg>` sempre; nunca `npm install` direto para libs nativas.
- Repo é público: nada de dados pessoais em seeds, screenshots ou docs.

## Como rodar
```bash
npm install
npm start            # QR code para o Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
