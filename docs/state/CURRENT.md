# Estado atual

## Sessão

- **Atual:** S8a implementada em 2026-11-01; falta conferir no Android.
- **Última concluída:** S8 (conferida no Android; glitch estético no backlog).
- **Próxima:** S9 (conclusão + resenha), depois S10 (estatísticas).

## Pronto (S8a)

- Segurar o chip de status (~500 ms) abre a `QuickStatusSheet`; o toque simples
  continua sem trocar status. A folha mostra capa/lombada, título e a
  `StatusWheel` com os quatro status. Deslizar só pré-visualiza (card e arte
  acompanham); soltar/tocar confirma e fecha; tocar fora/Cancelar descarta.
- `status-from-offset.ts` é a conta pura offset → status. A roda é um
  `ScrollView` vertical com snap. A11y: chip com hint + ação "Trocar status";
  roda `adjustable` com increment/decrement.
- Concluir preenche as páginas lidas no repositório de livros (formulário e
  roda), com a mesma regra no repositório em memória (ADR 0018).
- 16 testes novos (346 em 45 arquivos); lint, typecheck, test, doctor e export
  verdes. Falta a conferência no Android.

## Pronto (S8)

- `queue_items` com migração aditiva `0005`; a Ordem nasce vazia e o `sync`
  materializa todo livro não concluído. Status é a entrada/saída (ADR 0017).
- Dois blocos: `reading` em "Lendo agora" (primeiro = principal e bloco `active`
  do plano) e `queued`/`paused` em "Depois". Arrastar/setas não cruzam blocos.
- Repositório com `list`/`sync`/`move`/`replaceAll` em transação; os hooks
  sincronizam quando a estante muda e reordenar atualiza a Hoje.
- Drop via alça ainda pisca/animar antes de alocar (setas ok) — no backlog.

## Decisões abertas

- Rótulo de `queued`: a UI diz "Quero ler"; o dono chama de "Pretendo ler".
- Multisseleção da Estante no backlog pós-MVP; entrada e espera de 5 s ficam lá.
- S7.2 (opcional): persistir o plano + edição manual.
- Livro excluído deixa `reading_sessions`/`queue_items` órfãs; limpeza S9/S11.

## Arquivos-chave

- `src/features/library/EstanteScreen.tsx`, `quick-status-sheet.tsx`,
  `status-wheel.tsx`, `status-from-offset.ts` + testes
- `src/components/ui/Chip.tsx`
- `src/db/repositories/books.ts`, `src/test-utils/repositories.ts`
- `src/db/repositories/queue.ts`, `drizzle/0005_*.sql`, `src/features/queue/`
- `src/features/today/use-daily-plan.ts`, `planner/engine/selection.ts`
- `src/components/ui/Screen.tsx`, `src/app/_layout.tsx`, ADR 0017 e 0018

## Armadilhas

- A ordem tem dois blocos: `reading` no topo e o resto abaixo. `move` nunca deixa
  cruzar; não normalize a lista só por posição. `sync` é o gatilho de livro
  novo/status mudado; não remova.
- Posição nunca com empate/buraco: `move`/`replaceAll` reescrevem a lista toda;
  `list()` deriva se faltar linha. Concluído/órfão só sai na próxima escrita.
- Arrastar exige toque longo e bloqueia a rolagem nativa; o drop via alça ainda
  pisca (setas ok). `Screen` precisa do `ScrollView` do RNGH e o app do
  `GestureHandlerRootView`; no Jest, `react-native-worklets` vai para o mock.
- A roda separa prévia de escrita: `onScroll`/`onPreview` não podem chamar
  `update`; só `onSettle`/`onCommit` grava. A prévia vive na Estante.
- O chip só é interativo com `onPress` ou `onLongPress`; não desabilite o chip de
  status (ele não tem toque simples).
- Concluir (`finished`) sempre leva `pagesRead` ao total no repositório; trocar
  de volta para outro status mantém o progresso cheio.
- A Ordem não registra leitura nem muda status; o toque abre o detalhe.
- O motor devolve o plano **bruto**; `buildPlanView` compara com o lido hoje.
- Principal = primeiro Lendo da ordem; sem Lendo, o primeiro elegível leva o dia
  inteiro. Volta leve usa a última sessão (≥ 3 dias).
- Corte 0,7; conta inteira (`percentOf`). Teto de 60% só com principal e meta
  ≥ 10; meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve páginas lidas
  (fora a normalização de concluir, que usa o total).
- RNTL 14 é assíncrono; passe `booksRepository`, `queueRepository` e
  `readingRepository` ao `renderWithProviders`.
- Rota tipada: `.expo/types/router.d.ts` é gerado; renomeou rota? rode
  `npx expo start --offline`. Import entre features: caminho direto, não o barril.
- `isbn-ranges.ts`, `drizzle/*.sql` e `migrations.js` são gerados; `lint:fix`
  depois do generate.
