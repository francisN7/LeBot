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
src/components/ui componentes genéricos e arte vetorial (Screen, AppText, Button, Card, Chip, ConfirmDialog, BackButton, Spine, SpineArtwork, SpineFace, Mascot, TextField, BookCover, Bookmark, BookArt)
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
  → hook da feature (useBooks, useGenres, useQueue, useSettings,
    useReadingSessions, com refresh após escrita)
  → tela
```

- `src/db/client.ts` abre o banco uma vez (`PRAGMA journal_mode = WAL` e
  `foreign_keys = ON`). A abertura é lazy: importar o módulo não toca no
  aparelho, o que mantém os testes livres do módulo nativo.
- `src/db/repositories/index.ts` guarda os repositórios reais (singleton lazy).
- O hook usa o repositório injetado por contexto quando existe (testes) e cai
  no real quando não existe (app).
- `useBooks` avisa todas as telas que usam o mesmo repositório depois de
  escrever (assinaturas em `WeakMap`), então Estante, Ordem e Detalhe não ficam
  com dados velhos ao voltar do formulário. `useGenres` segue o mesmo padrão e
  expõe `genreById` para nome e cor. `useQueue` usa o mesmo padrão: mover um
  livro na Ordem atualiza `useQueueBookIds` e, com ele, o plano da Hoje.
  `useReadingSessions` avisa o repositório de leitura **e** chama
  `notifyBooksChanged`, então registrar páginas atualiza o progresso em todas as
  telas na hora. `useRecentSessions` assina o mesmo repositório e junta a janela
  de 7 dias com a sessão mais recente de qualquer data (é o que permite a volta
  leve).
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
  Estante, Ordem, Detalhe e Formulário.
- Sem FK: excluir gênero em uso e apagar o último gênero são bloqueados no
  repositório. Decisão: ADR 0010.

## Leitura (S5)

- `src/features/reading/` guarda o `ReadingForm` (modal de páginas com +1/+10),
  o `ReadingProgressCard` (barra, últimas leituras e desfazer) e o
  `useReadingSessions(bookId)`.
- Registrar não é uma rota: o card do detalhe e o botão do bloco da Hoje abrem
  o mesmo modal. O padrão da Hoje vem das páginas do bloco; o detalhe sugere 1.
- O repositório escreve sessão + `pages_read` + status numa transação só. A UI
  nunca soma páginas por conta própria; ela lê `book.pagesRead`, que é
  recarregado via `notifyBooksChanged`.
- Sessão acima do restante é aceita e o formulário avisa antes de salvar; o
  progresso para no total. Registrar em `queued` ou `paused` coloca o livro em
  `reading`; chegar no fim vira `finished` (ADR 0015, que supersede parte da
  ADR 0012). Desfazer não restaura o status anterior; desfazer o fim volta para
  `reading`.
- Remover um livro ainda deixa as sessões dele órfãs (sem FK). Não afeta o
  progresso; a limpeza entra junto com conclusão/resenha (S9).

## Abas e papéis (S7.1)

- Ordem das abas: **Estante, Hoje, Ordem, Ajustes**.
- **Hoje** manda na ação: mostra o plano do dia, registra leitura pelo botão de
  cada bloco e lista o que já foi lido hoje em "Lido hoje".
- **Ordem** (`/ordem`, `QueueScreen`) mostra todo livro não concluído e deixa o
  dono reordenar os blocos; o status é quem entra/sai. Não registra leitura;
  tocar no livro abre o detalhe.
- Glossário: a **UI diz "Ordem"**; o **código continua em inglês** (`queue`,
  `QueueItem`, `useQueueBookIds`). "Fila" só aparece em docs e sessões
  anteriores à S7.1, como termo histórico.
- Legenda aprovada: "A sequência é sua: o que ler depois do livro atual."; a
  contagem é "N livros depois do atual" (ou "N livros na ordem" sem principal) e
  a seção, "Na ordem".
- O plano é só de hoje; a Ordem é a sequência guardada e nunca uma previsão de
  amanhã.

## Ordem (S8)

- `src/features/queue/` tem `QueueScreen`, `QueueRow`, `suggest-order.ts` e
  `useQueue`.
- A Ordem é automática: `sync` materializa todo livro não concluído em
  `queue_items`; o status é a entrada/saída. Pausado aparece com aviso e fica
  fora do plano. Não há adicionar/remover manual (ADR 0017).
- Dois blocos: todos os `reading` no topo, depois `queued` e `paused`. O primeiro
  Lendo é o **principal**, coroado na tela, e é o bloco `active` do plano.
- Reordenar pelo arrastar usa `react-native-gesture-handler` + Reanimated: a
  alça entrega o deslocamento, a tela soma as alturas medidas das linhas e chama
  `move`. As setas ↑/↓ fazem o mesmo e são o caminho acessível. `move` não deixa
  cruzar os blocos.
- "Sugerir ordem" (`suggest-order.ts`) alterna gênero dentro de cada bloco; o
  primeiro Lendo não muda, então o principal é preservado.
- Reordenar não toca em `books.status`: registrar leitura continua sendo só na
  Hoje (S7.1).

## Plano (S6)

- O motor vive em `src/features/planner/engine/` e é puro: `buildPlan(input)`
  recebe dia, meta, livros, sessões e a ordem do dono; devolve os blocos do dia.
  Nada de React Native, banco, relógio global ou IA.
- Regras (meta 3–200, volta leve após 3 dias, principal = primeiro Lendo, teto
  flexível de 60% a partir de meta 10, alternância de gênero e sugestão paralela)
  estão em [`docs/planner-algorithm.md`](planner-algorithm.md); a decisão do
  plano é a ADR 0013 e a do principal é a ADR 0017.
- `src/features/planner/index.ts` é o barril da feature; a tela Hoje consome o
  motor desde a S7. Desde a S8, `useQueueBookIds` entrega a ordem persistida. O
  motor não grava plano nem conhece a Ordem.

## Hoje (S7/S7.1)

- `src/features/today/use-daily-plan.ts` monta o `PlannerInput` com `useBooks`,
  `useSettings`, `useRecentSessions` e `useQueueBookIds`, chama `buildPlan` e
  entrega o plano já cruzado com o dia (`buildPlanView`).
- O bloco ativo é o primeiro Lendo da Ordem (ADR 0017); sem nenhum Lendo, não há
  principal e o primeiro elegível leva o dia inteiro.
- `plan-view.ts` é puro: soma as páginas de hoje por livro, marca
  feito/agora/depois, monta `sessionsToday` (título, páginas aplicadas e hora
  local), escolhe a mensagem e o mascote. O motor continua sendo a única fonte
  da meta e dos blocos; a tela não repete regra.
- Seções: "Plano do dia" e "Lido hoje", sob o subtítulo "Seu plano de hoje".
  Meta batida aparece como "Meta batida · N páginas hoje", nunca como fração
  acima de 100%. "Lido hoje" fica vazio com "Nada registrado hoje ainda.".
- Cada bloco tem botão explícito: "Registrar leitura" (primário no "Agora",
  secundário nos demais) ou "Registrar mais" quando o bloco já foi feito.
- O selo "sugestão" segue o status do livro: `queued` (Pretendo Ler) leva o
  selo, porque o dono ainda não começou; `reading` não leva, porque já é uma
  decisão. O flag `suggestion` do motor continua definindo a ordem e o estado
  dos blocos, não o selo.
- O plano **não é persistido**: recalcula a cada abertura (decisão da S7). As
  sessões e `pages_read` são a fonte de verdade do progresso; o motor devolve o
  plano bruto e a UI compara com o que já foi lido hoje.
- A ordem vem de `useQueueBookIds`, lida de `queue_items`; reordenar na Ordem
  atualiza o hook e o plano na próxima montagem.
- O vazio mostra o mascote e leva para a Ordem ("Ver a ordem").
- Decisões: ADR 0014 e ADR 0015.

## Boot

`src/app/_layout.tsx`:

1. carrega fontes;
2. abre o banco (falha → tela `DatabaseError`);
3. aplica as migrações com `useMigrations` (falha → tela `DatabaseError`);
4. roda o seed só em banco vazio (`seedIfEmpty`);
5. esconde a splash e monta o `Stack` dentro do `GestureHandlerRootView`.

O `GestureHandlerRootView` é necessário para o arrastar da Ordem; o `Screen`
usa o `ScrollView` do gesture handler para o gesto não brigar com a rolagem.

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
- Plano recalculado na Hoje:
  [`docs/adr/0014-plano-recalculado-na-hoje.md`](adr/0014-plano-recalculado-na-hoje.md)
- Status ao registrar leitura:
  [`docs/adr/0015-status-ao-registrar.md`](adr/0015-status-ao-registrar.md)
- Ordem persistida:
  [`docs/adr/0016-ordem-persistida.md`](adr/0016-ordem-persistida.md)
- Ordem automática e principal:
  [`docs/adr/0017-ordem-automatica-e-principal.md`](adr/0017-ordem-automatica-e-principal.md)

## Pendências conhecidas

- Os ícones e o splash já são definitivos desde a S4a
  (`assets/images/` + `scripts/build-icons.mjs`), mas só aparecem em build
  nativo; o Expo Go não os exibe.
- `cover_uri` guarda caminho absoluto do aparelho: o backup JSON (S11) não pode
  reutilizá-lo em outro device.
- Tema escuro: os gêneros já guardam `color_dark`, mas faltam o toggle, os
  tokens de superfície e revisar o contraste das telas.
