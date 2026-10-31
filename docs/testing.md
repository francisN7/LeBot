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
| Funções puras (`src/lib`, motor do plano) | Node puro | regra de negócio (ISBN, busca, capa) |
| Repositórios (`src/db/repositories/*.test.ts`) | `sql.js` (wasm) + migrações reais de `drizzle/` | SQL, constraints e CRUD |
| Telas (`src/features/**/*.test.tsx`) | repositórios em memória, capa fake e `renderWithProviders` | renderização e interação |

### Banco de teste

`src/test-utils/sqlite.ts` sobe um SQLite em memória com `sql.js` e aplica as
migrações reais (`migrationsFolder: 'drizzle'`). Não há mock de SQL: se a
migração quebrar, o teste falha. Como o wasm é carregado uma vez por suíte,
esses testes são assíncronos (`await createTestDatabase()`).

### Telas

`renderWithProviders` já envolve a tela com `SafeAreaProvider`,
`BooksRepositoryProvider`, `GenresRepositoryProvider`,
`SettingsRepositoryProvider` e `CoverServiceProvider`. Por padrão usa os dados
do seed em memória (livros + 6 gêneros de fábrica) e um `CoverService` fake;
para cenários específicos:

```tsx
const books = createInMemoryBooksRepository([]);
const cover = createFakeCoverService('file:///tmp/capa.jpg');

await renderWithProviders(<EstanteScreen />, {
  booksRepository: books,
  coverService: cover,
});
```

`createFakeCoverService` não toca no disco nem na galeria: registra o que seria
salvo (`saved`) e apagado (`removed`). `pickedUri = null` simula o cancelamento
da galeria.

O repositório de gêneros em memória recebe a contagem de livros por callback
(`createInMemoryGenresRepository(rows, countBooks)`); `renderWithProviders`
liga essa contagem ao repositório de livros, então excluir um gênero em uso é
bloqueado também nos testes de tela.

Nunca importe `expo-sqlite`, `expo-file-system` ou `expo-image-picker` no teste:
são módulos nativos. As telas recebem `CoverService` por contexto justamente
para isso.

## Convenções

- RTL 14 é assíncrono: `await render(...)`, `await fireEvent.press(...)`.
- Prefira consultas por texto visível (`getByText`) e `getAllByText` quando o
  mesmo rótulo aparece duas vezes (ex.: título do livro e rótulo da lombada).
- Teste o comportamento, não a implementação: nada de snapshot de árvore.
- Dados de teste são fictícios; sem dados pessoais.
- Node local 26 vs CI 22: rode `npm run test` antes de culpar o CI.

## Cobertura da S3

- `src/lib/isbn.test.ts`: ISBN-10/13 válidos, dígito errado, tamanho e `X`;
  máscara de UI (`8535` → `85-35`, `97885359027` → `978-85-359-027`).
- `src/lib/book-search.test.ts`: busca sem acento/caixa e busca vazia.
- `src/lib/covers.test.ts`: nome do arquivo e `hasCover`.
- `src/db/repositories/books.test.ts`: ISBN normalizado, inválido, duplicado,
  capa gravada/removida e `updated_at`.
- `BookFormScreen.test.tsx`: criar, editar, ISBN inválido, ISBN duplicado,
  capa escolhida/removida e livro inexistente.
- `BookDetailScreen.test.tsx`: dados, edição e exclusão com confirmação.
- `EstanteScreen.test.tsx`: busca por título/autor/ISBN, filtro e navegação.
- `src/theme/typography.test.ts`: folga de `lineHeight` em `display`/`xxl`/`xl`.

O que continua manual: corte de descendentes e galeria só aparecem no Android.

## Cobertura da S3.2

- `src/lib/genre-color.test.ts`: hex válido/inválido, normalização, contraste
  (1:1 a 21:1) e par claro/escuro igual.
- `src/theme/genre-colors.test.ts`: 10 presets, `resolveGenreColor` nas duas
  pontas e contraste ≥ 3:1 contra creme ou navy.
- `src/db/repositories/genres.test.ts`: 6 gêneros de fábrica, criar/renomear,
  nome duplicado sem acento/caixa, cor inválida, contagem de livros, exclusão em
  uso e último gênero.
- `src/db/genres-migration.test.ts`: migração `0002` insere os 6 gêneros e
  mantém `books.genre` legível ao rodar de novo.
- `src/features/genres/genre-form.test.ts`: nome único e preset × cor custom.
- `src/features/genres/GenreFormScreen.test.tsx`: criar com preset e custom,
  hex inválido, renomear, excluir e bloqueio em uso.
- `src/features/genres/GenresScreen.test.tsx`: lista com contagem e navegação.
- `BookCover.test.tsx`: rótulo, fita na cor do gênero e modo botão.
- `AppText.test.tsx`: `label` sem `letterSpacing` e `numberOfLines` em largura
  justa.
- `BookFormScreen.test.tsx` e `EstanteScreen.test.tsx`: gênero vindo do banco
  (nome, cor e `genreId` salvo).

O que continua manual: contraste real das cores na lombada, fita sobre fotos
claras, recorte da borda em telas de baixa densidade e o "r" final no chip.
