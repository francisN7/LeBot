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
| `genre` | text | `fantasy`, `romance`, `nonfiction`, `classic`, `children`, `horror` |
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
do repositório; o banco só guarda o valor já normalizado.

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

Para criar uma migração:

```bash
# 1. edite src/db/schema.ts
npx drizzle-kit generate
npm run test   # os testes rodam as migrações reais
```

## Seed

`src/db/seed.ts` insere 5 livros fictícios e as preferências iniciais **só** em
banco vazio e uma vez por versão de seed (`seed.books.version`). Assim, livros
que o dono apagar não voltam no próximo boot.

## Repositórios

`src/db/repositories/books.ts` e `settings.ts` expõem funções síncronas
(`list`, `findById`, `create`, `update`, `remove`; `get`, `all`, `set`,
`remove`). Recebem a instância do Drizzle por parâmetro, então o mesmo código
roda no aparelho (`expo-sqlite`) e nos testes (`sql.js`).

- Entrada validada com Zod (`bookInputSchema`); `update` valida o livro
  completo (merge com a linha atual).
- ISBN inválido e ISBN repetido são rejeitados com mensagem clara; o valor é
  gravado normalizado.
- Nenhum SQL fora de `src/db/`.
- As telas acessam via hooks (`useBooks`, `useSettings`), nunca pelo
  repositório diretamente.

## Busca e capa

- Busca da Estante: filtro em memória (`src/lib/book-search.ts`), sem acento e
  sem caixa, combinado com o chip de status. Ver ADR 0009.
- Capa: `expo-image-picker` copia para `documentDirectory/covers/<id>.jpg` via
  `CoverService` (`src/lib/covers.ts` + `cover-service.ts`); o banco guarda só
  o caminho. Ver ADR 0009.
