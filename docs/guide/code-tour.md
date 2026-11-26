# Code tour

Roteiro para entender o código do LêBot em sete paradas, da abertura do app até
os testes. Em cada parada: o arquivo, o que olhar e por que importa. Os nomes
são de arquivo e símbolo (nunca número de linha) para o tour não envelhecer.

Para a visão em camadas, veja [`reference/architecture.md`](../reference/architecture.md);
este guia é o caminho de leitura, não a referência.

## 1. Boot: `src/app/_layout.tsx`

[`_layout.tsx`](../../src/app/_layout.tsx) é a primeira coisa que roda.

- **Olhe:** `RootLayout`, `DatabaseBoot` e o `SplashScreen.preventAutoHideAsync`
  no topo do módulo.
- **Por quê:** a ordem é fontes → banco (`getDb`) → migrações
  (`useMigrations` com `drizzle/migrations.js`) → providers de serviço
  (`CoverServiceProvider`, `BackupServiceProvider`, `DataVersionProvider`).
  A splash só some quando tudo isso terminou; erro de banco vira a tela
  `DatabaseError`, não um crash.
- As rotas ficam em `src/app/` e só montam telas: a aba Estante, por exemplo,
  é [`(tabs)/index.tsx`](<../../src/app/(tabs)/index.tsx>).

## 2. Visual: `src/theme/` e `src/components/ui/`

- **Olhe:** [`theme/index.ts`](../../src/theme/index.ts) (cores, espaçamento,
  tipografia, raios) e [`components/ui/index.ts`](../../src/components/ui/index.ts)
  (`AppText`, `Button`, `Card`, `Screen`, `Spine`…).
- **Por quê:** tela nenhuma usa cor ou tamanho solto; tudo sai dos tokens.
  `SpineArtwork` e `Mascot` são arte vetorial e estão entre os maiores
  arquivos do projeto (veja a linha de base abaixo).
- Referência: [`reference/design-system.md`](../reference/design-system.md).

## 3. Dados: `src/db/schema.ts` e `src/db/client.ts`

- **Olhe:** as tabelas em [`schema.ts`](../../src/db/schema.ts) (`genres`,
  `books`, `readingSessions`, `queueItems`, `reviews`) e `getDb` em
  [`client.ts`](../../src/db/client.ts).
- **Por quê:** o schema é a fonte das migrações (`drizzle/` é gerado, não se
  edita). `getDb` abre o banco uma vez só, com WAL e chaves estrangeiras
  ligadas, e é lazy para os testes não abrirem o SQLite do aparelho.
- Referência: [`reference/data-model.md`](../reference/data-model.md).

## 4. Repositório + hook: `books.ts` e `use-books.tsx`

- **Olhe:** `BooksRepository` e `createBooksRepository` em
  [`repositories/books.ts`](../../src/db/repositories/books.ts); `useBooks`,
  `useBooksRepository` e `notifyBooksChanged` em
  [`library/use-books.tsx`](../../src/features/library/use-books.tsx).
- **Por quê:** é o padrão de todas as features. Tela não fala SQL: chama o
  hook, que chama o repositório. Toda gravação avisa os assinantes do mesmo
  repositório, e as outras telas recarregam sem esperar a próxima navegação.
  O repositório vem por contexto, então o teste injeta um falso.

## 5. Uma feature inteira: `EstanteScreen.tsx`

- **Olhe:** [`library/index.ts`](../../src/features/library/index.ts) (o que a
  feature expõe) e `EstanteScreen` em
  [`EstanteScreen.tsx`](../../src/features/library/EstanteScreen.tsx).
- **Por quê:** é a feature de ponta a ponta: lê os livros com `useBooks`,
  anima a prateleira (`use-shelf-animations.ts`) e troca o status pela roda
  (`status-wheel-*`); a arte das lombadas sai de `spine-art.ts` e
  `spine-label.ts`. A lógica pura vive em arquivos `.ts` com teste próprio;
  o `.tsx` só compõe.

## 6. Lógica pura: `src/features/planner/engine/`

- **Olhe:** `buildPlan` em [`engine/plan.ts`](../../src/features/planner/engine/plan.ts)
  e o que [`engine/index.ts`](../../src/features/planner/engine/index.ts)
  exporta; depois `day.ts`, `selection.ts` e `rounding.ts`.
- **Por quê:** o plano diário é determinístico: entra `PlannerInput`, sai
  `Plan`, sem React, banco nem relógio escondido. Por isso cada regra tem teste
  unitário ao lado (`*.test.ts`).
- Referência: [`reference/planner.md`](../reference/planner.md).

## 7. Testes: `src/test-utils/` e um teste de tela

- **Olhe:** `renderWithProviders` em [`render.tsx`](../../src/test-utils/render.tsx),
  os `createInMemory*Repository` em
  [`repositories.ts`](../../src/test-utils/repositories.ts),
  `createTestDatabase` em [`sqlite.ts`](../../src/test-utils/sqlite.ts) e o
  [`EstanteScreen.test.tsx`](../../src/features/library/EstanteScreen.test.tsx).
- **Por quê:** tela é testada com repositório em memória injetado pelos
  providers; repositório é testado contra SQLite real em memória (sql.js) com
  as migrações de verdade.
- Como rodar e as camadas: [`testing.md`](testing.md).

## Convenções

- **Tamanho:** arquivo com até ~250 linhas. É aviso, não bloqueio: passou, vira
  candidato a refactor na ordem do relatório.
- **Feature = pasta + `index.ts`:** `src/features/<nome>/` expõe o que os
  outros podem usar pelo `index.ts`.
- **Import cruzado só pelo `index`:** de uma feature para outra, importe
  `@/features/<nome>`, nunca `@/features/<nome>/arquivo`. Hoje há imports
  profundos (veja a linha de base); não crie novos.
- **Comentário explica o porquê**, não o quê: o código diz o que faz.
- **Sem `any`**; validação de borda com Zod. Telas não falam SQL.

## Code report

```bash
npm run code:report
npm run code:report -- --top 20 --max-lines 200
```

O [`code-report.mjs`](../../scripts/code-report.mjs) lê só `src/`, ignora
testes, `src/test-utils/` e gerados, e lista: maiores arquivos, os acima do
limite, linhas por pasta e imports entre features (pelo `index` ou profundos).

### Linha de base (2026-11-26)

150 arquivos e 16.095 linhas; 12 acima de 250; 21 pares de features se
importam, com 26 alvos furando o `index`. Top 10:

| Linhas | Arquivo |
|---:|---|
| 710 | `src/components/ui/SpineArtwork.tsx` |
| 664 | `src/features/settings/backup/format.ts` |
| 441 | `src/features/queue/QueueScreen.tsx` |
| 415 | `src/features/library/EstanteScreen.tsx` |
| 379 | `src/components/ui/Mascot.tsx` |
| 363 | `src/features/library/BookFormScreen.tsx` |
| 357 | `src/features/queue/QueueRow.tsx` |
| 324 | `src/features/genres/GenreFormScreen.tsx` |
| 320 | `src/features/stats/aggregate.ts` |
| 299 | `src/features/settings/backup/service.ts` |

Os imports profundos mais repetidos são `library/use-books` e `library/types`
(de `genres`, `queue`, `reading`, `reviews`, `stats` e `today`) e os hooks de
`reading`, usados por `library` e `today`.
