# ADR 0008 — Testes de repositório com sql.js e as migrações reais

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S2

## Contexto

Os repositórios usam um banco síncrono com a API do Drizzle. O `expo-sqlite` é
módulo nativo e não roda no Node/Jest. Precisávamos cobrir CRUD, constraints e
migrações sem depender de device, emulador ou build nativo — inclusive no CI
(Ubuntu, Node 22).

Opções avaliadas:

1. **Mock do `expo-sqlite`.** Não executa SQL: testaria só o encanamento e
   deixaria migração/constraint sem cobertura.
2. **`better-sqlite3`.** Nativo; exige toolchain de compilação e pode não ter
   prebuild para todas as versões de Node.
3. **`sql.js` (wasm).** SQLite real, puro JavaScript/WASM, roda no Node e no CI
   sem compilar nada.

## Decisão

Testar repositórios com **`sql.js` + `drizzle-orm/sql-js`**, aplicando as
migrações reais de `drizzle/` (`migrationsFolder: 'drizzle'`).

- `src/test-utils/sqlite.ts` cria o banco em memória e roda as migrações; cada
  teste recebe um banco novo.
- O repositório é o mesmo código de produção: só muda o adaptador de banco
  (`expo-sqlite` no app, `sql.js` no teste). O tipo comum é
  `AppDatabase<TRunResult>` em `src/db/types.ts`.
- Testes de tela usam repositórios em memória (`src/test-utils/repositories.ts`)
  injetados por `renderWithProviders`; nenhum teste de UI importa
  `expo-sqlite`.
- `sql.js` e `@types/sql.js` ficam em `devDependencies`.

## Consequências

- Migração quebrada falha no teste, antes do device.
- O teste não cobre comportamento específico de plataforma (WAL, arquivo,
  fechamento do app); isso continua sendo verificação manual no Android.
- `sql.js` adiciona ~1,5 MB em `node_modules` de desenvolvimento, nada no
  bundle.
- Testes de banco são assíncronos por causa do carregamento do wasm.

## Alternativas descartadas

- **Mock de `expo-sqlite`:** não exercita SQL nem constraints.
- **`better-sqlite3`:** compilação nativa e prebuilds incertos no Node 22/26.
