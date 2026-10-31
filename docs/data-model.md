# Modelo de dados

Banco local do aparelho: SQLite aberto com `expo-sqlite`, versionado por
Drizzle. Nada sai do aparelho e nenhum dado real do dono vai para o repositório.

## Tabelas

### `books`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; `book-<base36>` gerado em `src/lib/id.ts` |
| `title` | text | obrigatório, sem espaços nas pontas |
| `author` | text | obrigatório, sem espaços nas pontas |
| `genre` | text | `genres.id`; sem FK física (ver abaixo) |
| `status` | text | `reading`, `queued`, `paused`, `finished` |
| `pages` | integer | > 0 |
| `pages_read` | integer | 0 ≤ `pages_read` ≤ `pages` (default 0) |
| `isbn` | text | opcional; ISBN-10/13 normalizado (só dígitos e `X`); único quando presente |
| `cover_uri` | text | opcional; caminho local `documentDirectory/covers/<id>.jpg` |
| `created_at` | integer | ms desde 1970 (`timestamp_ms` no Drizzle) |
| `updated_at` | integer | ms desde 1970; reescrito em todo `update` |

Constraints: `books_pages_positive`, `books_pages_read_range` e índice único
`books_isbn_unique` (SQLite permite vários `NULL`). Ordenação padrão:
`created_at`, desempate por `id`.

A validade do ISBN (dígito verificador) é checada em `src/lib/isbn.ts` e no Zod
do repositório; o banco só guarda o valor já normalizado (dígitos e `X`). A
máscara com hífens (`formatIsbnInput`) existe só na UI: o formulário formata
enquanto o dono digita, mas o valor salvo não tem hífen.

`books.genre` não tem FK para `genres`: o SQLite exigiria recriar a tabela, e a
migração precisa ser aditiva. A integridade fica no repositório de gêneros:
excluir um gênero em uso é bloqueado, e o último gênero nunca sai.

### `genres`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; de fábrica `fantasy`, `romance`, `nonfiction`, `classic`, `children`, `horror`; novos `genre-<base36>` |
| `name` | text | obrigatório, até 40 caracteres; único por conteúdo (trim, caixa e acento ignorados) |
| `color_light` | text | `#RRGGBB` do tema claro |
| `color_dark` | text | `#RRGGBB` do tema escuro; precisa ser diferente do claro |
| `palette_index` | integer | 0–9 quando veio da paleta; `NULL` para cor personalizada |
| `is_default` | integer | 1 nos 6 gêneros de fábrica (não muda depois) |
| `sort_order` | integer | ordem dos chips; gênero novo entra no fim |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Índices: `genres_name_unique` (nome) e `genres_sort_order_idx`. As cores são
**cópias** dos hexes: alterar a paleta não repinta quem já escolheu. Ver
ADR 0010.

### `settings`

| Coluna | Tipo | Regra |
|---|---|---|
| `key` | text | PK |
| `value` | text | obrigatório; tudo vira string |

Chaves usadas hoje: `goal.pages`, `reminder.time`, `appearance.theme`,
`backup.enabled`, `seed.books.version`.

## Migrações

- Fonte: `src/db/schema.ts`.
- Geradas com `npx drizzle-kit generate` para `drizzle/`.
- Aplicadas no boot por `useMigrations` (`drizzle-orm/expo-sqlite/migrator`).
- `drizzle/migrations.js` empacota os `.sql` via `babel-plugin-inline-import`;
  `metro.config.js` inclui `sql` em `sourceExts`.
- Nunca apagar o banco do usuário: migração nova só adiciona/altera estrutura.
- Erro de migração aparece em tela (`DatabaseError`) — não é engolido.
- `0002_slow_pepper_potts.sql` é aditiva: `CREATE TABLE genres`, dois índices e
  os 6 `INSERT` de fábrica. Nenhum `ALTER`/recreate em `books`.

Para criar uma migração:

```bash
# 1. edite src/db/schema.ts
npx drizzle-kit generate
npm run test   # os testes rodam as migrações reais
```

## Seed

`src/db/seed.ts` insere 5 livros fictícios e as preferências iniciais **só** em
banco vazio e uma vez por versão de seed (`seed.books.version`). Assim, livros
que o dono apagar não voltam no próximo boot. Os gêneros **não** passam pelo
seed: os 6 de fábrica vêm da migração `0002`, então existem mesmo antes do
primeiro seed.

## Repositórios

`src/db/repositories/books.ts`, `genres.ts` e `settings.ts` expõem funções
síncronas (`list`, `findById`, `create`, `update`, `remove`; `get`, `all`,
`set`, `remove`). Recebem a instância do Drizzle por parâmetro, então o mesmo
código roda no aparelho (`expo-sqlite`) e nos testes (`sql.js`).

- Entrada validada com Zod (`bookInputSchema`, `genreFields`); `update` valida
  a linha completa (merge com o valor atual).
- ISBN inválido e ISBN repetido são rejeitados com mensagem clara; o valor é
  gravado normalizado.
- Gênero: nome duplicado (sem acento/caixa), par de cores igual e hex inválido
  são rejeitados. `countBooks` e `nameExists` apoiam as telas; `remove` bloqueia
  gênero em uso e o último gênero.
- Nenhum SQL fora de `src/db/`.
- As telas acessam via hooks (`useBooks`, `useGenres`, `useSettings`), nunca
  pelo repositório diretamente.

## Busca e capa

- Busca da Estante: filtro em memória (`src/lib/book-search.ts`), sem acento e
  sem caixa, combinado com o chip de status. Ver ADR 0009.
- Capa: `expo-image-picker` copia para `documentDirectory/covers/<id>.jpg` via
  `CoverService` (`src/lib/covers.ts` + `cover-service.ts`); o banco guarda só
  o caminho. Ver ADR 0009.
- Exibição: `BookCover` cuida do arredondamento, da borda navy e da fita do
  gênero; `Bookmark` desenha a fita em SVG. Sem capa, `Spine` usa a cor do
  gênero do mapa `genreById`.
