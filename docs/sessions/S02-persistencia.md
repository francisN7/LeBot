# S02 — Persistência com SQLite + Drizzle

## Objetivo

Trocar as fixtures por dados reais no SQLite do aparelho: schema versionado,
migração inicial, repositórios testados e as 4 abas lendo do banco.

## Fora de escopo

- Cadastro/edição de livro na UI, ISBN e capas (S3).
- Registro de leitura e cálculo de progresso (S5).
- Motor do plano (S6) e backup JSON (S11).

## Tarefas

1. Instalar `expo-sqlite`, `drizzle-orm` e `drizzle-kit` com
   `npx expo install` / `npm install` conforme o caso.
2. Documentar o schema em `docs/data-model.md` e criar `src/db/schema.ts`:
   `books` (id, title, author, genre, status, pages, pages_read, created_at,
   updated_at) e `settings` (key, value).
3. Criar `src/db/client.ts` com `openDatabaseSync`, `PRAGMA journal_mode = WAL`
   e `PRAGMA foreign_keys = ON`; gerar a migração inicial com `drizzle-kit`.
4. Aplicar migrações no boot com `drizzle-orm/expo-sqlite/migrator` (ou API
   equivalente da versão instalada) e tratar erro sem esconder falha.
5. Implementar `src/db/repositories/books.ts` (`list`, `findById`, `create`,
   `update`, `remove`) e `settings.ts` (`get`, `set`); nenhum SQL nas telas.
6. Adicionar seed de desenvolvimento com os 5 livros fictícios da S1 apenas em
   banco vazio.
7. Ligar as features ao repositório por hooks/serviços (`useBooks`,
   `useSettings`), mantendo a UI atual.
8. Testes: repositório com banco em memória e telas com repositório fake.
9. Atualizar `docs/architecture.md`, `docs/data-model.md`, `docs/INDEX.md` e
   `docs/design/design-system.md` se a camada de dados mudar componentes.

## Aceite

- [x] CRUD de `books` coberto por testes e usando repositório.
- [ ] App abre no Android com os dados vindos do SQLite; reiniciar mantém os
      dados. *(pendente: verificação manual do dono; o agente validou
      `expo export --platform android` e os testes com `sql.js`)*
- [x] Migração roda uma vez e é idempotente.
- [x] Nenhum SQL fora de `src/db/`.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run doctor`
      verdes.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/architecture.md`,
`docs/design/design-system.md`, `docs/security-privacy.md`.

## Arquivos prováveis

`src/db/schema.ts`, `src/db/client.ts`, `src/db/migrations/*`,
`src/db/repositories/*`, `src/features/*/hooks/*`, `docs/data-model.md`,
`drizzle.config.ts`, `jest` config.

## Riscos

- **`expo-sqlite` no Jest:** o módulo nativo não roda no Node. Decidir cedo:
  repositórios recebem a instância de banco por injeção e o teste usa um driver
  em memória (`sql.js` ou equivalente puro). Se nenhum driver funcionar no
  Node 26, testar SQL puro com um fake mínimo e registrar a dívida.
- **Drizzle + Expo:** conferir a versão do `drizzle-orm` compatível com a API do
  `expo-sqlite` da SDK 58 antes de codar as migrações.
- **Migração no boot:** nunca apagar o banco do usuário; erro de migração deve
  aparecer em tela/log, não ser engolido.
- **Seed:** apenas dados fictícios; nunca dados pessoais no repositório público.
- Node local 26 vs CI 22: reproduzir falha com `npm run test` antes de culpar o
  código.
