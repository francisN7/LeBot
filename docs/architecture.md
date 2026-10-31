# Arquitetura

Esqueleto criado na S0; persistência entrou na S2 e a biblioteca completa
(cadastro, busca, capa) na S3. Cresce conforme as sessões entregam camadas.

## Camadas

```
src/app/          rotas (Expo Router) — só orquestram telas
src/features/*/   UI + hooks + serviços de uma feature
src/db/           schema Drizzle, client, migrações, seed e repositórios
src/lib/          funções puras, sem React Native
src/components/ui componentes genéricos (Screen, AppText, Button, Card, Chip, ConfirmDialog, Spine, TextField, BookCover, Bookmark)
src/theme/        tokens (cor, espaçamento, raio, tipografia, tamanhos)
drizzle/          SQL gerado pelo drizzle-kit (+ bundle das migrações)
types/            declarações globais versionadas (`expo/types`, `*.sql`)
```

Regras:

1. Tela não fala SQL: chama repositório, exposto por hook da feature.
2. Repositório não conhece React.
3. Motor do plano (`src/features/planner/engine/`) é puro e testável fora do
   React Native.
4. `src/app/` só compõe: sem regra de negócio, sem acesso a dados.
5. Sem `any`; validação de borda com Zod.
6. Estilo usa `className` (NativeWind) e tokens de `src/theme/`; nada de cor ou
   espaçamento solto no componente.

## Fluxo de dados

```
SQLite (expo-sqlite + Drizzle)
  → repositório (src/db/repositories, síncrono, recebe o db)
  → hook da feature (useBooks, useGenres, useSettings, com refresh após escrita)
  → tela
```

- `src/db/client.ts` abre o banco uma vez (`PRAGMA journal_mode = WAL` e
  `foreign_keys = ON`). A abertura é lazy: importar o módulo não toca no
  aparelho, o que mantém os testes livres do módulo nativo.
- `src/db/repositories/index.ts` guarda os repositórios reais (singleton lazy).
- O hook usa o repositório injetado por contexto quando existe (testes) e cai
  no real quando não existe (app).
- `useBooks` avisa todas as telas que usam o mesmo repositório depois de
  escrever (assinaturas em `WeakMap`), então Estante, Fila e Detalhe não ficam
  com dados velhos ao voltar do formulário. `useGenres` segue o mesmo padrão e
  expõe `genreById` para nome e cor.
- Erros de escrita sobem como exceção; validação de entrada é Zod no
  repositório.

## Biblioteca (S3)

- Rotas: `/livro/novo` (formulário), `/livro/[id]` (detalhe) e
  `/livro/[id]/editar` (mesmo formulário, em modo edição). As rotas só lêem
  params e navegam; a lógica mora em `src/features/library/`.
- Busca: filtro em memória (`src/lib/book-search.ts`) sobre a lista do
  `useBooks`, combinado com o chip de status.
- ISBN: `src/lib/isbn.ts` valida dígito verificador de ISBN-10/13; o
  repositório grava normalizado e recusa duplicado.
- Capa: `CoverService` (`src/lib/covers.ts`) escolhe na galeria
  (`expo-image-picker`), copia para `documentDirectory/covers/<id>.jpg`
  (`expo-file-system`) e remove ao trocar/excluir. A implementação nativa
  (`cover-service.ts`) é montada no `_layout.tsx` via `CoverServiceProvider`;
  as telas recebem o serviço por contexto e os testes recebem um fake.
- Decisão: ADR 0009.

## Gêneros (S3.2)

- Rotas: `/generos` (lista com contagem), `/generos/novo` e
  `/generos/[id]/editar`. Ajustes → "Gerenciar gêneros" abre a lista.
- `src/features/genres/` guarda as telas, o `genre-form.ts` (validação pura do
  formulário) e o `useGenres`.
- A paleta de 10 pares mora em `src/theme/genre-colors.ts`; a validação de hex e
  contraste, em `src/lib/genre-color.ts`. `resolveGenreColor` já aceita `dark`,
  mas a UI segue no claro.
- O livro guarda só `genreId`; nome e cor são resolvidos por `genreById` na
  Estante, Fila, Detalhe e Formulário.
- Sem FK: excluir gênero em uso e apagar o último gênero são bloqueados no
  repositório. Decisão: ADR 0010.

## Boot

`src/app/_layout.tsx`:

1. carrega fontes;
2. abre o banco (falha → tela `DatabaseError`);
3. aplica as migrações com `useMigrations` (falha → tela `DatabaseError`);
4. roda o seed só em banco vazio (`seedIfEmpty`);
5. esconde a splash e monta o `Stack`.

Nenhum passo apaga dados ou esconde erro de migração.

## Decisões

- Stack: [`docs/adr/0001-stack-e-arquitetura.md`](adr/0001-stack-e-arquitetura.md)
- Identidade: [`docs/adr/0002-identidade-lebot.md`](adr/0002-identidade-lebot.md)
- Design system: [`docs/adr/0006-design-system-nativewind.md`](adr/0006-design-system-nativewind.md)
- Persistência: [`docs/adr/0007-persistencia-sqlite-drizzle.md`](adr/0007-persistencia-sqlite-drizzle.md)
- Testes de banco: [`docs/adr/0008-testes-sqlite-sqljs.md`](adr/0008-testes-sqlite-sqljs.md)
- Biblioteca (busca e capas):
  [`docs/adr/0009-biblioteca-busca-e-capas.md`](adr/0009-biblioteca-busca-e-capas.md)
- Gêneros editáveis e cores:
  [`docs/adr/0010-generos-editaveis-e-cores.md`](adr/0010-generos-editaveis-e-cores.md)

## Pendências conhecidas

- Ícones e splash ainda são placeholders do template do Expo até a S4.
- A tela Hoje ainda usa o plano fictício: só a meta diária vem de `settings`.
  Plano persistido entra na S6/S7; a fila continua manual até a S8.
- `cover_uri` guarda caminho absoluto do aparelho: o backup JSON (S11) não pode
  reutilizá-lo em outro device.
- Tema escuro: os gêneros já guardam `color_dark`, mas faltam o toggle, os
  tokens de superfície e revisar o contraste das telas.
