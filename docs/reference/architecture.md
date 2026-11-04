# Arquitetura

**O que responde:** as camadas, o fluxo de dados e o desenho de cada feature.
**O que não responde:** o porquê de uma decisão (isso é [`adr/`](../adr/)) nem o
schema detalhado ([`data-model.md`](data-model.md)).

## Camadas

```
src/app/           rotas (Expo Router) — só orquestram telas
src/features/*/    UI + hooks + serviços de uma feature
src/db/            schema Drizzle, client, migrações, seed e repositórios
src/lib/           funções puras, sem React Native
src/components/ui/ componentes genéricos e arte vetorial
src/theme/         tokens (cor, espaçamento, raio, tipografia, tamanhos)
src/test-utils/    banco sql.js, repositórios em memória e providers de teste
```

Regras:

1. Tela não fala SQL: chama repositório, exposto por hook da feature.
2. Repositório não conhece React.
3. Motor do plano (`src/features/planner/engine/`) e agregação de estatísticas
   (`src/features/stats/aggregate.ts`) são puros e testáveis fora do RN.
4. `src/app/` só compõe: sem regra de negócio, sem acesso a dados.
5. Sem `any`; validação de borda com Zod.
6. Estilo usa `className` (NativeWind) e tokens de `src/theme/`.

## Fluxo de dados

```
SQLite (expo-sqlite + Drizzle)
  → repositório (src/db/repositories, síncrono, recebe o db)
  → hook da feature (useBooks, useGenres, useQueue, useSettings,
    useReadingSessions, useStats, useBackup, com refresh após escrita)
  → tela
```

- `src/db/client.ts` abre uma vez (WAL + `foreign_keys = ON`) e é lazy: importar
  não toca no aparelho, o que mantém os testes livres do módulo nativo.
  `repositories/index.ts` guarda os reais (singleton lazy).
- O hook usa o repositório injetado por contexto (testes) e cai no real (app).
- `useBooks` avisa as telas que compartilham o repositório (assinaturas em
  `WeakMap`), então Estante, Ordem e Detalhe não ficam com dados velhos.
  `useGenres`, `useQueue`, `useReadingSessions` e `useSettings` seguem o padrão;
  registrar leitura também chama `notifyBooksChanged`.
- A Estante lê `books` inteiro em memória (busca, filtro e contagem locais) e
  virtualiza só a renderização (`FlatList`, `numColumns={2}`). Se o acervo passar
  de dezenas de milhares, o plano é paginar e levar busca/filtro ao SQL (ADR 0024).
- Erros de escrita sobem como exceção; a borda valida com Zod.

## Biblioteca

- Rotas `/livro/novo`, `/livro/[id]` e `/livro/[id]/editar`; a lógica mora em
  `src/features/library/`.
- Busca em memória (`src/lib/book-search.ts`) combinada com o chip de status.
- ISBN: `src/lib/isbn.ts` valida ISBN-10/13; o repositório normaliza e recusa
  duplicado. A máscara usa a tabela oficial (`src/lib/isbn-ranges.ts`, gerada por
  `scripts/build-isbn-ranges.mjs`).
- Capa: `CoverService` escolhe na galeria, copia para
  `documentDirectory/covers/<id>.jpg` e remove ao trocar/excluir. A implementação
  nativa entra pelo `CoverServiceProvider`; testes recebem um fake.
- Troca rápida de status: toque longo no chip abre a roda radial
  (`StatusWheelOverlay`), com prévia na lombada e gravação ao soltar. A geometria
  é pura (`status-wheel-geometry.ts`) e a roda fica na mesma janela, sem `Modal`,
  para não cancelar o gesto. Concluir preenche `pages_read` (ADR 0018).

## Gêneros

- Rotas `/generos`, `/generos/novo` e `/generos/[id]/editar`, abertas por
  Ajustes → "Gerenciar gêneros".
- A paleta de 10 pares mora em `src/theme/genre-colors.ts`; validação de hex e
  contraste em `src/lib/genre-color.ts`. `resolveGenreColor` já aceita `dark`.
- O livro guarda só `genreId`; nome e cor vêm de `genreById`.
- Sem FK: excluir gênero em uso e apagar o último gênero são bloqueados no
  repositório (ADR 0010).

## Leitura

- `src/features/reading/` guarda o `ReadingForm` (modal com +1/+10), o
  `ReadingProgressCard` e `useReadingSessions(bookId)`.
- Registrar não é rota: o card do detalhe e o botão da Hoje abrem o mesmo modal.
- O repositório grava sessão + `pages_read` + status numa transação. A UI nunca
  soma páginas; lê `book.pagesRead`, recarregado por `notifyBooksChanged`.
- Sessão acima do restante é aceita com aviso; o progresso para no total.
  Registrar em `queued`/`paused` vira `reading`; chegar ao fim vira `finished`
  (ADR 0015). Desfazer não restaura o status anterior.
- Remover livro deixa sessões órfãs de propósito (histórico/estatísticas); a
  resenha e o item da ordem saem na mesma transação.

## Resenha

- Rota `/livro/[id]/resenha`; o detalhe abre por CTA e a sessão que conclui o
  livro abre a tela automaticamente, no detalhe e na Hoje (ADR 0019).
- Nota obrigatória (1–5), texto e citação opcionais. Campos extras globais viram
  chips em acordeão, sem perder o texto digitado.
- Campos são criados em Ajustes → "Campos de resenha"; excluir limpa o valor nas
  resenhas. Reabrir o livro esconde a resenha sem apagar; a próxima conclusão
  abre preenchida e salva por upsert.
- `quote` é coluna própria, pensando na futura galeria de citações.

## Estatísticas

- Rota `/estatisticas` ("Meu ritmo"), aberta pelo atalho da Estante. Não há aba
  nova: a Hoje continua focada no plano.
- `src/features/stats/` guarda a tela, os gráficos, `useStats` e três módulos
  puros: `period.ts` (janelas), `aggregate.ts` (números) e `insights.ts` (frase
  e humor do mascote).
- Períodos civis no dia local: 7 dias rotativos, mês corrente, mês + 2
  anteriores e ano jan→dez. O total para em hoje; meses futuros ficam vazios.
- Linha do tempo (`/linha-do-tempo`): `buildTimeline` monta totais desde a
  primeira leitura + grade jan→dez por ano. "Concluído em" é a última sessão;
  conclusão sem sessão usa `books.updated_at` e é marcada como aproximada.
- Sessões órfãs somam páginas e ficam fora de gênero/nota. Gráficos são
  `View`/NativeWind, acessíveis e sem biblioteca (ADR 0020).

## Ajustes e backup

- `AjustesScreen` tem quatro seções: **Leitura** (meta, lembrete, aparência),
  **Organização** (gêneros e campos de resenha), **Dados** (backup) e **Sobre**.
  Lembrete e Aparência são "Em breve"; `reminder.time`, `appearance.theme` e
  `backup.enabled` continuam em `settings`.
- Meta diária: `GoalCard` valida 3–200 e grava `goal.pages`; a Hoje recalcula.
- Backup (`settings/backup/`): `format.ts` (JSON v1 com Zod), `archive.ts` (ZIP
  com `fflate`), `service.ts` (arquivos) e `use-backup.tsx` (orquestração).
  `BackupRepository` exporta as sete tabelas e substitui tudo numa transação.
- Restauração valida em memória, prepara as capas no cache, troca o banco e só
  então move as capas; falha de capa deixa `cover_uri` nulo. O
  `seed.books.version` é reposto para backup vazio não semear exemplos.
- Fechar o aviso incrementa a versão de dados; o `AppStack` usa essa versão como
  `key` e remonta a navegação (todos os hooks releem o banco). A fila exportada
  só tem livro existente e não concluído, renumerada.

## Abas e Ordem

- Abas: **Estante, Hoje, Ordem, Ajustes**.
- **Hoje** manda na ação: plano do dia, botão por bloco e "Lido hoje".
- **Ordem** (`/ordem`) mostra todo livro não concluído e deixa reordenar; o
  status é quem entra/sai. Não registra leitura; tocar abre o detalhe.
- A UI diz "Ordem"; o código segue em inglês (`queue`, `QueueItem`).
- A Ordem é automática: `sync` materializa os não concluídos em `queue_items`
  (ADR 0017). Dois blocos: `reading` no topo, depois `queued` e `paused`. O
  primeiro Lendo é o **principal**, coroado na tela.
- Arrastar pela alça (toque longo) usa gesture handler + Reanimated e bloqueia a
  rolagem; as setas ↑/↓ fazem o mesmo e são o caminho acessível. `move` não
  cruza blocos. "Sugerir ordem" alterna gênero e preserva o principal.

## Plano e Hoje

- O motor (`src/features/planner/engine/`) é puro: `buildPlan(input)` recebe dia,
  meta, livros, sessões e ordem; devolve os blocos. Regras em
  [`planner.md`](planner.md); decisões nas ADRs 0013/0017.
- `use-daily-plan.ts` monta o input com `useBooks`, `useSettings`,
  `useRecentSessions` e `useQueueBookIds`, chama o motor e `buildPlanView`.
- `plan-view.ts` é puro: soma páginas de hoje, marca feito/agora/depois, monta
  `sessionsToday` e escolhe mensagem e mascote.
- Seções "Plano do dia" e "Lido hoje"; meta batida vira "Meta batida · N páginas
  hoje", nunca fração acima de 100%. Cada bloco tem ação explícita.
- O plano **não é persistido**: recalcula a cada abertura. Sessões e
  `pages_read` são a fonte de verdade.

## Boot

`src/app/_layout.tsx`: carrega fontes → abre o banco (falha → `DatabaseError`) →
aplica migrações (falha → `DatabaseError`) → seed só em banco vazio → esconde a
splash e monta o `Stack` no `GestureHandlerRootView`, com os providers de capa,
backup e versão de dados. A `key` da versão remonta a navegação após restauração.

O `GestureHandlerRootView` é necessário para o arrastar da Ordem; o `Screen` usa
o `ScrollView` do gesture handler para o gesto não brigar com a rolagem. Nenhum
passo apaga dados ou esconde erro de migração.
