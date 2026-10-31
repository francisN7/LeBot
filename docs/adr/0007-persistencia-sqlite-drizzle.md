# ADR 0007 — Persistência local com SQLite + Drizzle e migrações no boot

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S2

## Contexto

A S2 precisa trocar as fixtures por dados reais que sobrevivam ao fechamento do
app. O banco fica no aparelho (repo público, sem backend) e precisa evoluir sem
apagar o que o dono já cadastrou.

Opções avaliadas:

1. **AsyncStorage + JSON.** Simples, mas sem consultas, sem constraints e com
   reescrita do arquivo inteiro a cada mudança.
2. **SQLite com Drizzle.** Schema tipado, migrações versionadas, queries
   seguras e o mesmo modelo roda nos testes via `sql.js`.
3. **SQLite com SQL escrito à mão.** Menos dependências, mais strings soltas e
   risco de divergência entre schema e código.

## Decisão

Usar **`expo-sqlite` + `drizzle-orm`**, com schema em `src/db/schema.ts` e
migrações geradas por `drizzle-kit` em `drizzle/`.

- `openDatabaseSync` com `PRAGMA journal_mode = WAL` e `foreign_keys = ON`;
  abertura lazy em `getDb()` para não tocar no módulo nativo ao importar.
- Migrações aplicadas no boot com `useMigrations`; falha mostra `DatabaseError`
  em tela e mantém os dados intactos.
- Repositórios síncronos recebem o banco por parâmetro
  (`createBooksRepository(db)`), validam entrada com Zod e são a única porta de
  acesso a SQL (`src/db/`).
- Telas consomem hooks (`useBooks`, `useSettings`), que aceitam repositório
  injetado por contexto (testes) e caem no real em produção.
- Seed de 5 livros fictícios roda só em banco vazio e uma vez por versão,
  marcado em `settings` (`seed.books.version`).

## Consequências

- Toda mudança de schema exige `npx drizzle-kit generate` e novo commit em
  `drizzle/`; nunca editar migração já aplicada.
- O bundle cresce com o Drizzle (~1 MB a mais no Hermes), aceitável para um app
  local.
- SQL fica restrito a `src/db/`; code review pode checar isso por `grep`.
- `drizzle/migrations.js` depende de `babel-plugin-inline-import` e de `sql` em
  `metro.config.js.sourceExts`.
- A tela Hoje só lê a meta de `settings`; plano persistido fica para S6/S7.

## Alternativas descartadas

- **AsyncStorage/JSON:** sem constraints, sem consulta e sem migração segura.
- **SQL manual:** repetiria validações e não geraria tipos.
- **Banco remoto (Supabase):** fora do MVP e contraria "dados só no aparelho".
