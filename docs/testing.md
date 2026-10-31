# Como testar

Ferramentas: Jest 30 + `jest-expo` + Testing Library RN 14 (assíncrona) +
Biome. Tudo roda no Node; nenhum teste abre o SQLite do aparelho.

```bash
npm run test                 # todos
npm run test -- books        # filtra por caminho
npm run test:watch
npm run lint && npm run typecheck
```

## Três camadas de teste

| Camada | O que usa | O que garante |
|---|---|---|
| Funções puras (`src/lib`, motor do plano) | Node puro | regra de negócio |
| Repositórios (`src/db/repositories/*.test.ts`) | `sql.js` (wasm) + migrações reais de `drizzle/` | SQL, constraints e CRUD |
| Telas (`src/features/**/*.test.tsx`) | repositórios em memória + `renderWithProviders` | renderização e interação |

### Banco de teste

`src/test-utils/sqlite.ts` sobe um SQLite em memória com `sql.js` e aplica as
migrações reais (`migrationsFolder: 'drizzle'`). Não há mock de SQL: se a
migração quebrar, o teste falha. Como o wasm é carregado uma vez por suíte,
esses testes são assíncronos (`await createTestDatabase()`).

### Telas

`renderWithProviders` já envolve a tela com `SafeAreaProvider`,
`BooksRepositoryProvider` e `SettingsRepositoryProvider`. Por padrão usa os
dados do seed em memória; para cenários específicos:

```tsx
const books = createInMemoryBooksRepository([]);
await renderWithProviders(<EstanteScreen />, { booksRepository: books });
```

Nunca importe `expo-sqlite` no teste: o módulo nativo não roda no Node.

## Convenções

- RTL 14 é assíncrono: `await render(...)`, `await fireEvent.press(...)`.
- Prefira consultas por texto visível (`getByText`) e `getAllByText` quando o
  mesmo rótulo aparece duas vezes.
- Teste o comportamento, não a implementação: nada de snapshot de árvore.
- Dados de teste são fictícios; sem dados pessoais.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o CI.
