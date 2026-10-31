# ADR 0010 — Gêneros editáveis com paleta de duas cores

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S3.2

## Contexto

O gênero era um enum fixo (`fantasy`, `romance`, …) no schema, com nome e cor
duplicados na UI (`src/features/library/genre.ts`). O dono precisa criar,
renomear, recolorir e excluir gêneros, e cada gênero precisa de um par de cores
(claro + escuro) porque o tema escuro está no backlog.

Restrições:

- o banco do dono já tem livros com `books.genre` preenchido; nada pode perder
  o gênero na atualização (só migração aditiva);
- SQLite exige recriar a tabela para adicionar FK — não aceitável nesta sessão;
- nada de dependência nova de color picker;
- o app segue claro; o tom escuro só fica guardado.

## Decisão

### Tabela `genres`, `books.genre` continua igual

- Nova tabela `genres` com `name`, `color_light`, `color_dark`,
  `palette_index`, `is_default`, `sort_order` e timestamps.
- `books.genre` mantém o nome da coluna e passa a guardar `genres.id`. Não há
  FK física; a integridade fica no repositório.
- A migração `0002` cria a tabela, insere os 6 gêneros de fábrica (mesmos ids do
  enum antigo, mesmas cores) e não toca em `books`.
- Renomear ou recolorir um gênero repinta todos os livros dele sem `UPDATE` em
  massa: a cor e o nome são resolvidos pelo mapa `genreById`.

### Nome único por conteúdo, não por bytes

- O índice `genres_name_unique` protege contra duplicata exata.
- O repositório compara nomes com `normalizeGenreName` (minúsculas, sem acento,
  espaços repetidos), então "Terror" e "terror " são o mesmo gênero.

### Paleta de 10 pares, com cópia no gênero

- `src/theme/genre-colors.ts` guarda os pares claro/escuro.
- O gênero grava os **hexes**, não só o índice: mudar a paleta depois não
  repinta a escolha do dono. `palette_index` só marca o preset selecionado.
- `resolveGenreColor(genre, scheme)` já aceita `dark`; a UI passa `light` até o
  tema escuro existir.
- Cor personalizada é validada em `src/lib/genre-color.ts` (`#RRGGBB`, par
  diferente) e só **avisa** quando o contraste é baixo — a escolha é do dono.
- O teste da paleta exige 3:1 contra o creme **ou** contra o navy: o bloco
  colorido sempre aparece sobre um dos dois.

### Exclusão com trava no repositório

- Com livros usando: bloqueia e informa a contagem.
- Último gênero: bloqueia sempre.
- Não há exclusão em cascata nem reatribuição automática.

### Capa e fita

- `BookCover` (ui) desenha a capa com o mesmo raio e borda dos cards; a borda
  fica dentro do tamanho da lombada (88×128) e o `overflow: hidden` impede a
  imagem de vazar.
- `Bookmark` usa `react-native-svg` para a fita com entalhe em "V", na cor do
  gênero, no canto superior esquerdo. A fita é desenhada sobre a capa, então a
  cor do gênero continua visível quando existe imagem.

### `label` sem letter-spacing

- O `letterSpacing` do `AppText` `label` fazia o Android medir a linha sem o
  último espaçamento e quebrar a letra final ("Terro/r"). Saiu do token;
  containers justos usam `numberOfLines={1}`.

## Consequências

- Gênero virou dado: Ajustes → Gêneros lista, cria e edita; o formulário de
  livro lê a ordem de `sort_order`.
- O render da estante depende de `useGenres`; se o gênero sumir por fora do
  app, a UI mostra "Sem gênero" e a lombada em `navyMuted`.
- Sem FK, um `INSERT` fora do repositório pode criar livro com gênero
  inexistente. Aceito: todo acesso passa por `src/db/` e o backup (S11) vai
  exportar gêneros junto.
- O tema escuro futuro só precisa trocar o `scheme` na resolução da cor; os
  pares já estão no banco.
- `react-native-svg` entra no bundle; conferir tamanho no export Android.

## Alternativas descartadas

- **Enum + tabela de cores separada:** não deixa o dono criar gênero.
- **FK com recriação de `books`:** risco de perder dados na migração do dono.
- **Guardar só `palette_index`:** mudar a paleta repintaria escolhas antigas e
  impediria cor personalizada.
- **Color picker nativo:** dependência nova e UX pior que dois campos hex com
  preview.
- **Excluir gênero em uso movendo os livros para outro:** decisão silenciosa
  sobre dados do dono.
