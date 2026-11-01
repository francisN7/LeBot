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
enquanto o dono digita, mas o valor salvo não tem hífen — ver
[Máscara do ISBN](#máscara-do-isbn) no fim.

`books.genre` não tem FK para `genres`: o SQLite exigiria recriar a tabela, e a
migração precisa ser aditiva. A integridade fica no repositório de gêneros:
excluir um gênero em uso é bloqueado, e o último gênero nunca sai.

### `reading_sessions`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; `reading-<base36>` gerado em `src/lib/id.ts` |
| `book_id` | text | `books.id`; indexado (`reading_sessions_book_idx`) |
| `pages` | integer | > 0 (`reading_sessions_pages_positive`); o que foi lido na sessão |
| `applied_pages` | integer | quanto de `pages` entrou em `books.pages_read`; `NULL` nas linhas anteriores à S5.1 (vale `pages`) |
| `read_at` | integer | dia da leitura (`timestamp_ms`), não o momento do salvamento |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Sem FK física, pelo mesmo motivo de `books.genre`: a integridade fica no
repositório de leitura, que recusa livro inexistente.

### `queue_items`

| Coluna | Tipo | Regra |
|---|---|---|
| `book_id` | text | PK e `books.id`; um livro entra no máximo uma vez |
| `position` | integer | 0..n-1, sempre compacta; o repositório reescreve a lista inteira |
| `note` | text | opcional; ainda sem editor na UI (S8) |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Índice `queue_items_position_idx`. Sem FK física, pelo mesmo motivo das outras
tabelas: a integridade fica no repositório. A Ordem é automática: `sync`
materializa todo livro não concluído (`reading`, `queued` e `paused`) e remove
linhas de livro concluído/excluído. `position` é reescrita em dois blocos:
`reading` primeiro (o primeiro é o principal), depois os demais. Mudar o status é
o que entra/sai da ordem; não há adicionar/remover manual. Ver ADR 0017.

### Progresso: duas cópias, um dono

- `reading_sessions` é o **histórico**; `books.pages_read` é a coluna que as
  telas leem (Estante, detalhe, Ordem, plano).
- Só `src/db/repositories/reading-sessions.ts` escreve nas duas, na mesma
  transação. Nenhuma tela soma sessões por conta própria.
- Sessão maior que o restante é aceita: o histórico guarda `pages` como foi
  digitado, mas `pages_read` para no total (`appliedPages` < `pages` avisa a UI).
- `applied_pages` guarda o que entrou de fato; desfazer a sessão desconta esse
  valor, não o digitado.
- O formulário do livro e o repositório impedem `pages_read` abaixo da soma de
  `applied_pages` das sessões: para reduzir, é preciso desfazer os registros.
- Registrar em livro `queued` ou `paused` coloca o livro em `reading` na mesma
  transação; é a regra de "quem registra está lendo" (ADR 0015). Chegar ao total
  muda o status para `finished`. Desfazer não restaura o status anterior (ele
  não é guardado) e desfazer o fim volta para `reading` (ADR 0012).
- Concluir pela edição ou pela roda de status preenche `pages_read` até o total
  no repositório de livros; a tela não manda as páginas (ADR 0018).
- Baixar `pages_read` de um livro concluído reabre (`finished` → `reading`); se
  o novo progresso ainda chega ao total, ele continua concluído. Em `reading`
  com 100%, a UI não diz "concluído": pede para baixar as páginas ou desfazer
  uma sessão (adendo S9 da ADR 0018).

### `reviews`

| Coluna | Tipo | Regra |
|---|---|---|
| `book_id` | text | PK e `books.id`; uma resenha por livro |
| `rating` | integer | 1–5 (`reviews_rating_range`) |
| `text` | text | opcional; texto principal da resenha |
| `quote` | text | opcional; trecho favorito, pronto para a futura galeria |
| `extras` | text (JSON) | `{ "<review_fields.id>": "texto" }`; chave sem valor não entra |
| `created_at` / `updated_at` | integer | ms desde 1970; upsert preserva `created_at` |

Sem FK física. A resenha sobrevive quando o livro volta para `reading`; a UI a
esconde e a próxima conclusão reaproveita a linha. Valor vazio não vira chave,
e excluir o campo limpa a chave em todas as resenhas. Excluir o livro apaga a
resenha na mesma transação (`books.remove`). Salvar é upsert por `book_id`.
Ver ADR 0019.

### `review_fields`

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | text | PK; `field-<base36>` gerado em `src/lib/id.ts` |
| `name` | text | obrigatório, até 40 caracteres; único por conteúdo (trim, caixa e espaços ignorados) |
| `sort_order` | integer | ordem dos chips; campo novo entra no fim |
| `created_at` / `updated_at` | integer | ms desde 1970 |

Índices: `review_fields_name_unique` (nome) e `review_fields_sort_order_idx`.
São campos **globais**: o dono cria em Ajustes → "Campos de resenha" e cada
resenha preenche o que quiser. Renomear mantém o `id` e os textos; excluir apaga
a chave correspondente nos `extras` de todas as resenhas.

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
- `0003_cloudy_pretty_boy.sql` é aditiva: `CREATE TABLE reading_sessions` e o
  índice `reading_sessions_book_idx`. Banco da S0–S4 ganha a tabela vazia, sem
  perder livros nem gêneros.
- `0004_clever_turbo.sql` é aditiva: `ALTER TABLE reading_sessions ADD
  applied_pages integer`. As linhas existentes ficam com `NULL` e valem como
  `pages` até serem desfeitas.
- `0005_crazy_vivisector.sql` é aditiva: `CREATE TABLE queue_items` e o índice
  `queue_items_position_idx`. A Ordem nasce vazia; nenhum livro muda de lugar ou
  de status na migração.
- `0006_lame_warbound.sql` é aditiva: `CREATE TABLE reviews` (com o `CHECK` da
  nota) e `CREATE TABLE review_fields` com os dois índices. Nenhum livro ou
  resenha existente é reescrito; os campos extras nascem vazios.

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

`src/db/repositories/books.ts`, `genres.ts`, `queue.ts`, `reading-sessions.ts` e
`settings.ts` expõem funções síncronas (`list`, `findById`, `create`, `update`,
`remove`; `get`, `all`, `set`, `remove`). Recebem a instância do Drizzle por
parâmetro, então o mesmo código roda no aparelho (`expo-sqlite`) e nos testes
(`sql.js`).

- Entrada validada com Zod (`bookInputSchema`, `genreFields`,
  `readingSessionInputSchema`); `update` valida a linha completa (merge com o
  valor atual).
- ISBN inválido e ISBN repetido são rejeitados com mensagem clara; o valor é
  gravado normalizado.
- Gênero: nome duplicado (sem acento/caixa), par de cores igual e hex inválido
  são rejeitados. `countBooks` e `nameExists` apoiam as telas; `remove` bloqueia
  gênero em uso e o último gênero.
- Leitura: `create` grava a sessão e soma em `pages_read` na mesma transação
  (teto no total, `finished` automático); `remove` desconta e nunca deixa o
  progresso negativo. `listByBook` ordena do mais recente para o mais antigo;
  `listBetween(from, to)` é a base das estatísticas da S10.
- Ordem: `sync` materializa todo livro não concluído em dois blocos (`reading`
  primeiro, depois os demais) e limpa concluído/órfão; `list` deriva a ordem se
  faltar linha; `move` só anda dentro do bloco do livro; `replaceAll` reescreve
  0..n-1 numa transação mantendo os blocos. Nenhuma operação muda o status.
- Nenhum SQL fora de `src/db/`.
- As telas acessam via hooks (`useBooks`, `useGenres`, `useQueue`, `useSettings`,
  `useReadingSessions`), nunca pelo repositório diretamente.

## Busca e capa

- Busca da Estante: filtro em memória (`src/lib/book-search.ts`), sem acento e
  sem caixa, combinado com o chip de status. Ver ADR 0009.
- Capa: `expo-image-picker` copia para `documentDirectory/covers/<id>.jpg` via
  `CoverService` (`src/lib/covers.ts` + `cover-service.ts`); o banco guarda só
  o caminho. Ver ADR 0009.
- Exibição: `BookCover` cuida do arredondamento, da borda navy e da fita do
  gênero; `Bookmark` desenha a fita em SVG. Sem capa, `Spine` usa a cor do
  gênero do mapa `genreById`.

## Máscara do ISBN

`formatIsbnInput` resolve o grupo, o registrante e a publicação pela tabela
oficial da International ISBN Agency, e não pelo padrão brasileiro fixo:

- **Tabela:** `src/lib/isbn-ranges.ts` é gerado por
  `node scripts/build-isbn-ranges.mjs [xml]` a partir de
  `https://www.isbn-international.org/export_rangemessage.xml`. O cabeçalho
  guarda `MessageSerialNumber`, `MessageDate` e a contagem de grupos/faixas; o
  app nunca consulta a rede.
- **Formato:** cada grupo vira uma string `inicio:tamanho` por faixa, em ordem
  crescente. O fim de uma faixa é o início da seguinte menos um. `tamanho` 0
  marca faixa sem registrante definido e não recebe hífen. O script quebra se a
  agência mandar faixas com lacuna.
- **Grupo:** o mais longo prefixo válido do EAN (1 a 5 dígitos). Enquanto o
  texto digitado não fecha nenhum grupo, a máscara devolve os dígitos crus.
- **Registrante:** com 7 dígitos depois do grupo a faixa é exata; com menos, o
  hífen só entra se todas as faixas candidatas tiverem o mesmo tamanho. É o que
  evita a máscara "pular" durante a digitação.
- **ISBN-10:** usa o grupo do prefixo 978 e o mesmo algoritmo, sem o EAN na
  saída. O dígito verificador só é separado quando o código fecha (10 ou 13
  dígitos).

Exemplos: `978-0-306-40615-7`, `978-85-359-0277-8`, `978-3-16-148410-0`,
`979-10-90636-07-1` e `85-359-0277-2`. O banco continua guardando só dígitos.
