# Como testar

**O que responde:** as três camadas de teste, o banco em memória e as convenções
que evitam flakiness. **O que não responde:** o que cada sessão testou (isso é
histórico) nem como rodar o app (veja [`setup.md`](setup.md)).

Ferramentas: Jest 30 + `jest-expo` + Testing Library RN 14 (assíncrona) + Biome.
Tudo roda no Node; nenhum teste abre o SQLite do aparelho.

```bash
npm run test                 # todos
npm run test -- books        # filtra por caminho
npm run test:watch
npm run lint && npm run typecheck
```

## Três camadas

| Camada | O que usa | O que garante |
|---|---|---|
| Funções puras (`src/lib`, motor do plano) | Node puro | regra de negócio (ISBN, busca, capa) |
| Repositórios (`src/db/repositories/*.test.ts`) | `sql.js` (wasm) + migrações reais de `drizzle/` | SQL, constraints e CRUD |
| Telas (`src/features/**/*.test.tsx`) | repositórios em memória e `renderWithProviders` | renderização e interação |

### Banco de teste

`src/test-utils/sqlite.ts` sobe um SQLite em memória com `sql.js` e aplica as
migrações reais (`migrationsFolder: 'drizzle'`). Não há mock de SQL: se a
migração quebrar, o teste falha. O wasm é carregado uma vez por suíte, então
esses testes são assíncronos (`await createTestDatabase()`).

### Telas

`renderWithProviders` envolve a tela com `SafeAreaProvider`, os providers de
livros, gêneros, leitura, ajustes e capa. Por padrão usa o seed em memória
(livros + 6 gêneros), um repositório de leitura ligado ao de livros e um
`CoverService` fake:

```tsx
const books = createInMemoryBooksRepository([]);
const cover = createFakeCoverService('file:///tmp/capa.jpg');

await renderWithProviders(<EstanteScreen />, {
  booksRepository: books,
  coverService: cover,
});
```

- `createFakeCoverService` não toca no disco: registra `saved`/`removed`;
  `pickedUri = null` simula o cancelamento da galeria.
- Gêneros em memória recebem a contagem por callback; excluir gênero em uso é
  bloqueado também nos testes de tela.
- Leitura em memória mexe no **mesmo** repositório de livros, mantendo progresso
  e status coerentes como a transação do SQLite. A ordem em memória compacta
  posições e ignora órfãos/concluídos como o SQL.
- A roda radial usa `createGestureController` +
  `getByGestureTestId('gesture-status-<id>')`: `begin`/`activate` abrem, `update`
  muda a prévia e `end` grava. Envolva em `await act(async () => …)` porque o
  `runOnJS` do mock roda numa microtask. O destaque vem de
  `accessibilityState.selected`; o efeito real, do repositório. A saída desmonta
  ~180 ms depois; espere com `waitFor`. Nunca afirme sobre frames do Reanimated.
- A Estante é `FlatList` virtualizada (`numColumns={2}`). Em teste só a primeira
  leva é montada; para a lista inteira, use a contagem do cabeçalho ou a busca.
  Não simule rolagem para "provar" virtualização.
- Nunca importe `expo-sqlite`, `expo-file-system` ou `expo-image-picker` no
  teste: são módulos nativos. As telas recebem `CoverService` por contexto.

## Convenções

- RTL 14 é assíncrono: `await render(...)`, `await fireEvent.press(...)`.
- Prefira texto visível (`getByText`) e `getAllByText` quando o mesmo rótulo
  aparece duas vezes (título do livro e rótulo da lombada).
- Teste comportamento, não implementação: nada de snapshot de árvore.
- Dados de teste são fictícios.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o CI.
- Reanimated roda pelo resolver oficial
  (`jest.resolver = react-native-reanimated/jest/resolver` no `package.json`).
  Se um teste falhar com `loadUnpackersWithCode`, o resolver saiu do lugar.
- `react-native-gesture-handler` usa o `jestSetup` oficial e o teste global mapeia
  `react-native-worklets` para o mock. Sem esse mapa, a suíte quebra com
  `getUIRuntimeHolder is not supported on web`.

## Onde os testes vivem

- Puro: `src/lib/*.test.ts`, `planner/engine/plan.test.ts`,
  `stats/{period,aggregate,timeline}.test.ts`.
- Banco: `src/db/repositories/*.test.ts` e `src/db/seed.test.ts`.
- Tela: ao lado da tela (`*.test.tsx`) e `src/components/ui/*.test.tsx`.

O CI roda lint, typecheck, `docs:check` e a suíte inteira. Cobertura não é meta;
comportamento coberto é.
