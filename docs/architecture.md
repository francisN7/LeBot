# Arquitetura

Esqueleto criado na S0; persistência entrou na S2. Cresce conforme as sessões
entregam camadas.

## Camadas

```
src/app/          rotas (Expo Router) — só orquestram telas
src/features/*/   UI + hooks + serviços de uma feature
src/db/           schema Drizzle, client, migrações, seed e repositórios
src/lib/          funções puras, sem React Native
src/components/ui componentes genéricos (Screen, AppText, Button, Card, Chip, Spine)
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
  → hook da feature (useBooks, useSettings, com refresh após escrita)
  → tela
```

- `src/db/client.ts` abre o banco uma vez (`PRAGMA journal_mode = WAL` e
  `foreign_keys = ON`). A abertura é lazy: importar o módulo não toca no
  aparelho, o que mantém os testes livres do módulo nativo.
- `src/db/repositories/index.ts` guarda os repositórios reais (singleton lazy).
- O hook usa o repositório injetado por contexto quando existe (testes) e cai
  no real quando não existe (app).
- Erros de escrita sobem como exceção; validação de entrada é Zod no
  repositório.

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

## Pendências conhecidas

- Ícones e splash ainda são placeholders do template do Expo até a S4.
- A tela Hoje ainda usa o plano fictício: só a meta diária vem de `settings`.
  Plano persistido entra na S6/S7; a fila continua manual até a S8.
