# Arquitetura

Esqueleto criado na S0; persistência entrou na S2, a biblioteca na S3, os
gêneros na S3.2 e a identidade 3D na S4. O registro de leitura chegou na S5; o
motor do plano chegou na S6. Cresce conforme as sessões entregam camadas.

## Camadas

```
src/app/          rotas (Expo Router) — só orquestram telas
src/features/*/   UI + hooks + serviços de uma feature
src/db/           schema Drizzle, client, migrações, seed e repositórios
src/lib/          funções puras, sem React Native
src/components/ui componentes genéricos e arte vetorial (Screen, AppText, Button, Card, Chip, ConfirmDialog, BackButton, Spine, SpineArtwork, SpineFace, Mascot, TextField, BookCover, Bookmark)
src/theme/        tokens (cor, espaçamento, raio, tipografia, tamanhos)
src/test-utils/   banco sql.js, repositórios em memória e providers de teste
scripts/          geradores (ícone/splash e faixas do ISBN)
drizzle/          SQL gerado pelo drizzle-kit (+ bundle das migrações)
types/            declarações globais versionadas (`expo/types`, `*.sql`)
```

Regras:

1. Tela não fala SQL: chama repositório, exposto por hook da feature.
2. Repositório não conhece React.
3. Motor do plano (`src/features/planner/engine/`, S6) é puro e testável fora do
   React Native.
4. `src/app/` só compõe: sem regra de negócio, sem acesso a dados.
5. Sem `any`; validação de borda com Zod.
6. Estilo usa `className` (NativeWind) e tokens de `src/theme/`; nada de cor ou
   espaçamento solto no componente.
7. Arte de lombada/mascote é vetorial e paramétrica (ADR 0011): o mapa puro
   `src/features/library/spine-art.ts` decide expressão e paleta, e os
   componentes só desenham. Nenhuma imagem de arte entra no bundle.

## Fluxo de dados

```
SQLite (expo-sqlite + Drizzle)
  → repositório (src/db/repositories, síncrono, recebe o db)
  → hook da feature (useBooks, useGenres, useSettings, useReadingSessions,
    com refresh após escrita)
  → tela
```

- `src/db/client.ts` abre o banco uma vez (`PRAGMA journal_mode = WAL` e
  `foreign_keys = ON`). A abertura é lazy: importar o módulo não toca no
  aparelho, o que mantém os testes livres do módulo nativo.
- `src/db/repositories/index.ts` guarda os repositórios reais (singleton lazy).
- O hook usa o repositório injetado por contexto quando existe (testes) e cai
  no real quando não existe (app).
- `useBooks` avisa todas as telas que usam o mesmo repositório depois de
  escrever (assinaturas em `WeakMap`), então Estante, Fila e Detalhe não ficam
  com dados velhos ao voltar do formulário. `useGenres` segue o mesmo padrão e
  expõe `genreById` para nome e cor. `useReadingSessions` avisa o repositório de
  leitura **e** chama `notifyBooksChanged`, então registrar páginas atualiza o
  progresso em todas as telas na hora.
- Erros de escrita sobem como exceção; validação de entrada é Zod no
  repositório.

## Biblioteca (S3)

- Rotas: `/livro/novo` (formulário), `/livro/[id]` (detalhe) e
  `/livro/[id]/editar` (mesmo formulário, em modo edição). As rotas só lêem
  params e navegam; a lógica mora em `src/features/library/`.
- Busca: filtro em memória (`src/lib/book-search.ts`) sobre a lista do
  `useBooks`, combinado com o chip de status.
- ISBN: `src/lib/isbn.ts` valida dígito verificador de ISBN-10/13; o
  repositório grava normalizado e recusa duplicado. A máscara de UI usa a
  tabela oficial de faixas (`src/lib/isbn-ranges.ts`, gerada do XML da
  International ISBN Agency por `scripts/build-isbn-ranges.mjs`).
- Capa: `CoverService` (`src/lib/covers.ts`) escolhe na galeria
  (`expo-image-picker`), copia para `documentDirectory/covers/<id>.jpg`
  (`expo-file-system`) e remove ao trocar/excluir. A implementação nativa
  (`cover-service.ts`) é montada no `_layout.tsx` via `CoverServiceProvider`;
  as telas recebem o serviço por contexto e os testes recebem um fake.
- Decisão: ADR 0009.

## Gêneros (S3.2)

- Rotas: `/generos` (lista com contagem), `/generos/novo` e
  `/generos/[id]/editar`. Ajustes → "Gerenciar gêneros" abre a lista.
- `src/features/genres/` guarda as telas, o `genre-form.ts` (validação pura do
  formulário) e o `useGenres`.
- A paleta de 10 pares mora em `src/theme/genre-colors.ts`; a validação de hex e
  contraste, em `src/lib/genre-color.ts`. `resolveGenreColor` já aceita `dark`,
  mas a UI segue no claro.
- O livro guarda só `genreId`; nome e cor são resolvidos por `genreById` na
  Estante, Fila, Detalhe e Formulário.
- Sem FK: excluir gênero em uso e apagar o último gênero são bloqueados no
  repositório. Decisão: ADR 0010.

## Leitura (S5)

- `src/features/reading/` guarda o `ReadingForm` (modal de páginas com +1/+10),
  o `ReadingProgressCard` (barra, últimas leituras e desfazer) e o
  `useReadingSessions(bookId)`.
- Registrar não é uma rota: o card do detalhe e o "Começar" da Fila abrem o
  mesmo modal. O padrão da Fila já vem de `plannedPages`; o detalhe sugere 1.
- O repositório escreve sessão + `pages_read` + status numa transação só. A UI
  nunca soma páginas por conta própria; ela lê `book.pagesRead`, que é
  recarregado via `notifyBooksChanged`.
- Sessão acima do restante é aceita e o formulário avisa antes de salvar; o
  progresso para no total. Ao chegar no fim o status vira `finished` e, ao
  desfazer, volta para `reading`. Decisão: ADR 0012.
- Remover um livro ainda deixa as sessões dele órfãs (sem FK). Não afeta o
  progresso; a limpeza entra junto com conclusão/resenha (S9).

## Plano (S6)

- O motor vive em `src/features/planner/engine/` e é puro: `buildPlan(input)`
  recebe dia, meta, livros, sessões e a ordem da fila; devolve os blocos do dia.
  Nada de React Native, banco, relógio global ou IA.
- Regras (meta 3–200, volta leve após 3 dias, ativo em 7 dias, teto flexível de
  60% a partir de meta 10, alternância de gênero e sugestão paralela) estão em
  [`docs/planner-algorithm.md`](planner-algorithm.md); a decisão, na ADR 0013.
- `src/features/planner/index.ts` é o barril da feature; a S7 consome o motor na
  tela Hoje. A S8 passa a fila real no lugar da fixture. O motor não grava plano
  nem conhece a fixture.

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
- Biblioteca (busca e capas):
  [`docs/adr/0009-biblioteca-busca-e-capas.md`](adr/0009-biblioteca-busca-e-capas.md)
- Gêneros editáveis e cores:
  [`docs/adr/0010-generos-editaveis-e-cores.md`](adr/0010-generos-editaveis-e-cores.md)
- Arte vetorial paramétrica:
  [`docs/adr/0011-arte-vetorial-parametrica.md`](adr/0011-arte-vetorial-parametrica.md)
- Progresso de leitura:
  [`docs/adr/0012-progresso-e-status-automatico.md`](adr/0012-progresso-e-status-automatico.md)
- Motor do plano:
  [`docs/adr/0013-motor-do-plano.md`](adr/0013-motor-do-plano.md)

## Pendências conhecidas

- A tela Hoje ainda usa o plano fictício: só a meta diária vem de `settings`.
  O motor existe desde a S6; a S7 consome na UI e decide sobre persistência. A
  fila continua manual até a S8. O botão "Começar sessão" da Hoje ainda mostra
  "Em breve".
- Os ícones e o splash já são definitivos desde a S4a
  (`assets/images/` + `scripts/build-icons.mjs`), mas só aparecem em build
  nativo; o Expo Go não os exibe.
- `cover_uri` guarda caminho absoluto do aparelho: o backup JSON (S11) não pode
  reutilizá-lo em outro device.
- Tema escuro: os gêneros já guardam `color_dark`, mas faltam o toggle, os
  tokens de superfície e revisar o contraste das telas.
