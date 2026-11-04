# Modelo de dados

**O que responde:** tabelas, integridade, migrações, seed, repositórios e backup.
**O que não responde:** o porquê de cada decisão (veja o ADR) nem o desenho das
telas ([`architecture.md`](architecture.md)).

Banco local do aparelho: SQLite com `expo-sqlite`, versionado por Drizzle. Nada
sai do aparelho e nenhum dado real do dono vai para o repositório.

## Tabelas

### `books`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; `book-<base36>` (`src/lib/id.ts`) |
| `title` / `author` | text | obrigatórios, sem espaços nas pontas |
| `genre` | text | `genres.id`; sem FK física |
| `status` | text | `reading`, `queued`, `paused`, `finished` |
| `pages` | integer | > 0 |
| `pages_read` | integer | 0 ≤ `pages_read` ≤ `pages` (default 0) |
| `isbn` | text | ISBN-10/13 normalizado (dígitos e `X`); único quando presente |
| `cover_uri` | text | caminho local `documentDirectory/covers/<id>.jpg` |
| `created_at` / `updated_at` | integer | ms desde 1970; `updated_at` muda em todo `update` |

Constraints: `books_pages_positive`, `books_pages_read_range` e o índice único
`books_isbn_unique` (SQLite permite vários `NULL`). Ordem padrão: `created_at`,
desempate por `id`.

O dígito verificador é checado em `src/lib/isbn.ts` e no Zod do repositório; o
banco guarda só dígitos e `X`, e os hífens existem apenas na UI. `books.genre`
não tem FK porque o SQLite exigiria recriar a tabela: a integridade fica no
repositório de gêneros (excluir gênero em uso é bloqueado; o último nunca sai).

### `reading_sessions`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; `reading-<base36>` |
| `book_id` | text | `books.id`; indexado (`reading_sessions_book_idx`) |
| `pages` | integer | > 0 (`reading_sessions_pages_positive`); lido na sessão |
| `applied_pages` | integer | quanto entrou em `books.pages_read`; `NULL` em linhas antigas (valem `pages`) |
| `read_at` | integer | dia da leitura (`timestamp_ms`), não o momento do salvamento |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Sem FK física, pelo mesmo motivo. `listBetween` alimenta as estatísticas;
`listAll`, a linha do tempo; `listLatestPerBook` devolve a última sessão de cada
livro e data a conclusão. Não existe `finished_at`.

### `queue_items`

| Coluna | Tipo | Regra |
|---|---|---|
| `book_id` | text | PK e `books.id`; um livro entra no máximo uma vez |
| `position` | integer | 0..n-1, sempre compacta; o repositório reescreve a lista |
| `note` | text | opcional; ainda sem editor na UI |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Índice `queue_items_position_idx`; sem FK física. A Ordem é automática: `sync`
materializa todo livro não concluído e remove concluído/excluído. `position` é
reescrita em dois blocos: `reading` primeiro (o primeiro é o principal), depois
os demais. Mudar o status é o que entra/sai (ADR 0017).

### Progresso: duas cópias, um dono

- `reading_sessions` é o **histórico**; `books.pages_read` é o que as telas leem.
  Só `reading-sessions.ts` escreve nas duas, na mesma transação.
- Sessão maior que o restante é aceita: o histórico guarda `pages`, mas
  `pages_read` para no total (`applied_pages` < `pages` avisa a UI). Desfazer
  desconta `applied_pages`, não o digitado.
- Registrar em `queued`/`paused` vira `reading`; chegar ao total vira `finished`
  (ADR 0015). Desfazer não restaura o status e o fim volta para `reading`.
- Concluir pela edição ou pela roda preenche `pages_read` até o total (ADR 0018).
  Em `reading` com 100%, a UI pede para baixar páginas ou desfazer uma sessão.

### `reviews`

| Coluna | Tipo | Regra |
|---|---|---|
| `book_id` | text | PK e `books.id`; uma resenha por livro |
| `rating` | integer | 1–5 (`reviews_rating_range`) |
| `text` / `quote` | text | opcionais; texto principal e trecho favorito |
| `extras` | text (JSON) | `{ "<review_fields.id>": "texto" }`; chave sem valor não entra |
| `created_at` / `updated_at` | integer | ms desde 1970; upsert preserva `created_at` |

Sem FK física. A resenha sobrevive quando o livro volta para `reading`: a UI a
esconde e a próxima conclusão reaproveita a linha. Excluir o campo limpa a chave
em todas as resenhas; excluir o livro apaga a resenha na mesma transação. Salvar
é upsert por `book_id` (ADR 0019).

### `review_fields`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; `field-<base36>` |
| `name` | text | até 40 caracteres; único por conteúdo (trim, caixa e espaços) |
| `sort_order` | integer | ordem dos chips; campo novo entra no fim |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Índices `review_fields_name_unique` e `review_fields_sort_order_idx`. Campos
globais, criados em Ajustes → "Campos de resenha". Renomear mantém o `id` e os
textos; excluir apaga a chave nos `extras` de todas as resenhas.

### `genres`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; de fábrica `fantasy`, `romance`, `nonfiction`, `classic`, `children`, `horror`; novos `genre-<base36>` |
| `name` | text | até 40 caracteres; único por conteúdo (trim, caixa e acento) |
| `color_light` / `color_dark` | text | `#RRGGBB` do par; o escuro difere do claro |
| `palette_index` | integer | 0–9 quando veio da paleta; `NULL` para cor personalizada |
| `is_default` | integer | 1 nos 6 de fábrica (não muda depois) |
| `sort_order` | integer | ordem dos chips; novo entra no fim |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Índices `genres_name_unique` e `genres_sort_order_idx`. As cores são **cópias**
dos hexes: mudar a paleta não repinta quem já escolheu (ADR 0010).

### `settings`

| Coluna | Tipo | Regra |
|---|---|---|
| `key` | text | PK |
| `value` | text | obrigatório; tudo vira string |

Chaves usadas: `goal.pages`, `backup.last_exported_at` (ISO UTC) e
`seed.books.version`. `reminder.time`, `appearance.theme` e `backup.enabled`
continuam semeadas para o futuro; a UI as mostra como "Em breve".

## Migrações

- Fonte: `src/db/schema.ts`; geradas com `npx drizzle-kit generate` para
  `drizzle/`; aplicadas no boot por `useMigrations`.
- `drizzle/migrations.js` empacota os `.sql` via `babel-plugin-inline-import` e o
  Metro inclui `sql` em `sourceExts`.
- Migração nova só **adiciona** estrutura; nunca apaga o banco. Erro aparece em
  `DatabaseError`, não é engolido. As migrações existentes são todas aditivas
  (`genres`, `reading_sessions`, `applied_pages`, `queue_items`, `reviews` +
  `review_fields`); o SQL é a fonte do detalhe.

## Seed

`src/db/seed.ts` insere 5 livros fictícios e as preferências iniciais **só** em
banco vazio e uma vez por versão (`seed.books.version`). Livros apagados não
voltam. Os 6 gêneros de fábrica vêm da migração, não do seed.

## Repositórios

`books`, `genres`, `queue`, `reading-sessions`, `reviews`, `review-fields`,
`settings` e `backup` expõem funções síncronas (`list`, `findById`, `create`,
`update`, `remove`; `get`, `all`, `set`; `exportAll`, `counts`, `replaceAll`).
Recebem o Drizzle por parâmetro, então o mesmo código roda no aparelho e no
`sql.js`. Nenhum SQL fora de `src/db/`.

- Entrada validada com Zod; `update` valida a linha completa (merge). ISBN
  inválido/repetido é rejeitado e gravado normalizado.
- Gênero: nome duplicado, par de cores igual e hex inválido são rejeitados;
  `remove` bloqueia gênero em uso e o último.
- Leitura: `create` grava a sessão e soma em `pages_read` na mesma transação
  (teto no total, `finished` automático); `remove` desconta sem ficar negativo.
- Ordem: `sync` materializa os não concluídos em dois blocos e limpa
  concluído/órfão; `move` só anda dentro do bloco; `replaceAll` reescreve 0..n-1.
- Backup: `exportAll` lê as sete tabelas, descarta da fila o que não é livro
  válido e renumera; `replaceAll` apaga e insere numa transação, repondo
  `seed.books.version` (ADR 0021).

## Busca e capa

- Busca da Estante: filtro em memória (`src/lib/book-search.ts`), sem acento e
  sem caixa, combinado com o chip de status (ADR 0009).
- Capa: `expo-image-picker` copia para `documentDirectory/covers/<id>.jpg` via
  `CoverService`; o banco guarda só o caminho. `BookCover` cuida do acabamento e
  `Bookmark` desenha a fita; sem capa, `Spine` usa a cor do gênero.

## Backup

- `.zip` manual com `backup.json` (formato 1) e `covers/<bookId>.jpg`; o JSON tem
  as sete tabelas, datas ISO e `cover_uri` relativo (ADR 0021).
- Exportar escolhe a pasta e grava direto nela; importar escolhe o ZIP. Cancelar
  não toca no banco nem na data. Exportar aborta se um `cover_uri` não existe.
- Importar valida em memória, prepara as capas no cache, substitui o banco numa
  transação e move as capas. Capa que falha deixa o livro sem capa; arquivos
  antigos fora do backup são removidos.
- Sessão órfã continua válida no histórico; item de ordem e resenha precisam de
  livro existente e item de ordem de concluído é recusado.
- `settings` leva `backup.last_exported_at` e repõe `seed.books.version`; backup
  vazio não semeia exemplos no próximo boot.

## Máscara do ISBN

`formatIsbnInput` resolve grupo, registrante e publicação pela tabela oficial da
International ISBN Agency, não por um padrão brasileiro fixo:

- **Tabela:** `src/lib/isbn-ranges.ts`, gerada por
  `node scripts/build-isbn-ranges.mjs [xml]` do XML oficial. O cabeçalho guarda
  número de série, data e contagem; o app nunca consulta a rede.
- **Faixas:** cada grupo vira `inicio:tamanho` em ordem crescente; `tamanho` 0 não
  recebe hífen e o script quebra se houver lacuna. O grupo é o prefixo válido mais
  longo do EAN (1–5 dígitos); sem grupo fechado, a máscara devolve os dígitos.
- **Registrante:** com 7 dígitos a faixa é exata; com menos, o hífen só entra se
  todas as candidatas tiverem o mesmo tamanho (evita "pular" na digitação).
  ISBN-10 usa o grupo do prefixo 978 e o verificador só é separado no fim.

Exemplos: `978-0-306-40615-7`, `978-85-359-0277-8`, `978-3-16-148410-0`,
`979-10-90636-07-1` e `85-359-0277-2`. O banco guarda só dígitos.
