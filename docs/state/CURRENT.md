# Estado atual

## Sessão

- **Atual:** S8 em andamento (implementada; falta conferir no Android).
- **Última concluída:** S7.1 (conferida no Android em 2026-11-01).
- **Próxima:** S8a (`S08a-troca-rapida-status.md`): roda de troca rápida de status.
- **Depois:** S9 (conclusão + resenha) e S10 (estatísticas).

## Pronto (S8)

- `queue_items` (`book_id` PK, `position`, `note`, timestamps) com migração
  aditiva `0005`; a Ordem nasce vazia no aparelho.
- `src/db/repositories/queue.ts`: `list`, `add`, `remove`, `move` e `replaceAll`
  em transação, posições 0..n-1; ignora órfão/concluído e recusa concluído.
  Adicionar pausado não muda o status (ADR 0016).
- `useQueue`/`useQueueBookIds` assinam o repositório: reordenar atualiza a Hoje.
- Ordem real: seletor para adicionar, remover com confirmação, arrastar pela
  alça (RNGH + Reanimated) e setas ↑/↓ acessíveis.
- "Sugerir ordem" (`suggest-order.ts`): mantém o primeiro, alterna gênero, é
  determinística/idempotente e aplica direto; desabilita quando já é a ordem.
- `Screen` usa o `ScrollView` do gesture handler e o root monta
  `GestureHandlerRootView`; o Jest usa o `jestSetup` do RNGH e mapeia
  `react-native-worklets` para o mock.
- 335 testes (44 arquivos); lint, typecheck/test/doctor/export verdes.

## Decisões abertas

- S8a: onde a roda aparece, quando grava e o livro com capa — decidir na abertura.
- Rótulo de `queued`: a UI diz "Quero ler"; o dono chama de "Pretendo ler".
- Multisseleção da Estante no backlog pós-MVP; entrada e espera de 5 s ficam lá.
- S7.2 (opcional): persistir o plano + edição manual.
- Livro excluído deixa `reading_sessions`/`queue_items` órfãs; limpeza S9/S11.

## Arquivos-chave

- `src/db/schema.ts`, `src/db/repositories/queue.ts`, `drizzle/0005_*.sql`
- `src/features/queue/` (`QueueScreen`, `QueueRow`, `AddToQueueSheet`,
  `use-queue`, `suggest-order`)
- `src/test-utils/repositories.ts` (`createInMemoryQueueRepository`)
- `src/features/today/use-daily-plan.ts`, `planner/engine/selection.ts`
- `src/components/ui/Screen.tsx`, `src/app/_layout.tsx`, ADR 0016

## Armadilhas

- Posição nunca com empate/buraco: `move` e `replaceAll` reescrevem a lista
  inteira numa transação, não só a linha movida.
- `list()` ignora excluído/concluído, mas a linha só sai na próxima escrita.
- Arrastar entrega o deslocamento; a tela usa as alturas de `onLayout`. Sem
  altura, o gesto não move (as setas funcionam).
- `Screen` precisa do `ScrollView` do RNGH e o app do `GestureHandlerRootView`.
- Jest: `react-native-worklets` no mock; sem isso o RNGH quebra com
  `getUIRuntimeHolder is not supported on web`.
- A Ordem não registra leitura nem muda status; o toque abre o detalhe.
- O motor devolve o plano **bruto**; `buildPlanView` compara com o lido hoje.
- Ativo = `reading` com sessão em 0–6 dias; volta leve = ≥ 3 dias. Registrar em
  pausado/`queued` muda o status para `reading` (ADR 0015).
- Corte 0,7; conta inteira (`percentOf`). Teto de 60% só com ativo e meta ≥ 10;
  meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve, chamando
  `notifyBooksChanged`.
- RNTL 14 é assíncrono; passe `booksRepository`, `queueRepository` e
  `readingRepository` ao `renderWithProviders`.
- Rota tipada: `.expo/types/router.d.ts` é gerado; renomeou rota? rode
  `npx expo start --offline` antes do typecheck. Import entre features: caminho
  direto, nunca o barril (require cycle).
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
