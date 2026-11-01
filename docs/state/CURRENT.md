# Estado atual

## Sessão

- **Atual:** S8 em andamento (implementada; falta conferir no Android).
- **Última concluída:** S7.1 (conferida no Android em 2026-11-01).
- **Próxima:** S8a (`S08a-troca-rapida-status.md`): roda de troca rápida de status.
- **Depois:** S9 (conclusão + resenha) e S10 (estatísticas).

## Pronto (S8)

- `queue_items` (`book_id` PK, `position`, `note`, timestamps) com migração
  aditiva `0005`; a Ordem nasce vazia e o `sync` materializa os livros.
- Ordem automática: todo livro não concluído entra; `reading` forma o bloco
  "Lendo agora", `queued`/`paused` ficam em "Depois". Status é a entrada/saída,
  sem adicionar/remover (ADR 0017).
- O primeiro Lendo é o principal (coroa/"Principal") e o bloco `active` do
  plano; o motor não usa mais a sessão mais recente para escolher o ativo.
- Arrastar (toque longo na alça de 3 barras, com brilho e prévia; drop sem
  animação) ou setas animadas; não cruza blocos. Novo Lendo entra no fim de
  "Lendo agora" e "Sugerir ordem" alterna gênero por bloco.
- Repositório com `list`/`sync`/`move`/`replaceAll` em transação; os hooks
  sincronizam quando a estante muda e reordenar atualiza a Hoje.
- `Screen` usa o `ScrollView` do RNGH e o root monta `GestureHandlerRootView`;
  no Jest, `react-native-worklets` é mapeado para o mock.
- 330 testes (44 arquivos); lint, typecheck/test/doctor/export verdes.

## Decisões abertas

- S8a: onde a roda aparece, quando grava e o livro com capa — decidir na abertura.
- Rótulo de `queued`: a UI diz "Quero ler"; o dono chama de "Pretendo ler".
- Multisseleção da Estante no backlog pós-MVP; entrada e espera de 5 s ficam lá.
- S7.2 (opcional): persistir o plano + edição manual.
- Livro excluído deixa `reading_sessions`/`queue_items` órfãs; limpeza S9/S11.

## Arquivos-chave

- `src/db/schema.ts`, `src/db/repositories/queue.ts`, `drizzle/0005_*.sql`
- `src/features/queue/` (`QueueScreen`, `QueueRow`, `use-queue`,
  `suggest-order`)
- `src/test-utils/repositories.ts` (`createInMemoryQueueRepository`)
- `src/features/today/use-daily-plan.ts`, `planner/engine/selection.ts`
- `src/components/ui/Screen.tsx`, `src/app/_layout.tsx`, ADR 0017

## Armadilhas

- A ordem tem dois blocos: `reading` no topo (na ordem manual) e o resto abaixo.
  `move` nunca deixa cruzar; não normalize a lista só por posição.
- `sync` é o que materializa livro novo/status mudado. Ele roda no `useQueue`
  quando `books` muda; não remova esse gatilho.
- Posição nunca com empate/buraco: `move`/`replaceAll` reescrevem a lista toda;
  `list()` deriva se faltar linha e concluído/órfão só sai na próxima escrita.
- Arrastar exige toque longo; bloqueia a rolagem nativa, calcula a prévia do
  alvo com `onLayout` e confirma com `move` ao soltar.
- `Screen` precisa do `ScrollView` do RNGH e o app do `GestureHandlerRootView`;
  no Jest, `react-native-worklets` vai para o mock (senão o RNGH quebra).
- A Ordem não registra leitura nem muda status; o toque abre o detalhe.
- O motor devolve o plano **bruto**; `buildPlanView` compara com o lido hoje.
- Principal = primeiro Lendo da ordem; sem Lendo, não há principal e o primeiro
  elegível leva o dia inteiro. Volta leve ainda usa a última sessão (≥ 3 dias).
- Corte 0,7; conta inteira (`percentOf`). Teto de 60% só com principal e meta
  ≥ 10; meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve, chamando
  `notifyBooksChanged`.
- RNTL 14 é assíncrono; passe `booksRepository`, `queueRepository` e
  `readingRepository` ao `renderWithProviders`.
- Rota tipada: `.expo/types/router.d.ts` é gerado; renomeou rota? rode
  `npx expo start --offline`. Import entre features: caminho direto, não o barril.
- `isbn-ranges.ts`, `drizzle/*.sql` e `drizzle/migrations.js` são gerados; rode
  `npm run lint:fix` depois de `drizzle-kit generate`.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
npx drizzle-kit generate      # depois de mudar src/db/schema.ts
npm run lint:fix              # normaliza migrations.js e o snapshot
```
