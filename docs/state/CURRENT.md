# Estado atual

## Sessão

- **Atual:** S7 concluída. A tela Hoje mostra o plano real do motor.
- **Última concluída:** S7. Antes: S6 + auditoria de docs + hardening de CI.
- **Próxima:** S8 (`docs/sessions/S08-fila-real.md`), trocar a fixture da Fila por
  uma fila persistida e reordenável.

## Pronto (S7 — plano na UI)

- `useDailyPlan` monta `PlannerInput` com `useBooks`, `useSettings`,
  `useRecentSessions(7, hoje)` e `useQueueBookIds`, chama `buildPlan` e entrega
  `plan` + `view`.
- `plan-view.ts` (puro): lê a meta (vazio/inválido → 18; fora de 3–200 o
  `clampGoal` limita), soma as páginas de hoje por livro, marca
  feito/agora/depois, escolhe mensagem e mascote. Nenhuma regra do plano é
  duplicada na UI.
- `useRecentSessions`: janela de 7 dias (`listBetween`) **mais** `latest()` do
  repositório, então a volta leve funciona mesmo com a última sessão há meses.
- Hoje: cartão da meta com progresso do dia e aviso de volta leve/meta < 10,
  cartão do LêBot, blocos com `BookArt` (capa ou lombada), gênero, páginas,
  selo "sugestão"/"fecha o livro" e chip Feito/Agora/Depois. Toque no bloco abre
  o `ReadingForm` com as páginas do bloco. Vazio: mascote + "Ver a fila".
- Plano **não é persistido**; recalcula a cada abertura (ADR 0014). Sem edição
  manual nesta sessão.
- `BookArt` saiu da Fila para `src/components/ui/` e as duas telas usam o mesmo.
- `src/features/today/__fixtures__/daily-plan.ts` foi apagado.
- 13 testes novos (295 na suíte, 40 arquivos); `lint`, `typecheck`, `test`,
  `doctor` e `expo export` verdes. **Android ainda não conferido pelo dono.**

## Decisões abertas

- S7.1 (opcional): persistir o plano do dia + edição manual, se virar
  prioridade. Hoje o dia é recalculado e não sobrevive a edição.
- S8: modelo da fila (`queue_items` × coluna em `books`), o que entra nela e
  como reordenar (setas × arrastar) — decidir na abertura (spec S08).
- Excluir livro deixa `reading_sessions` órfãs (sem FK). Limpeza na S9/S11.
- `queued`/`paused` não viram `reading` ao registrar páginas; só `reading` vira
  `finished`. Ajustar na S9 se incomodar.

## Arquivos-chave

- `src/features/today/` (`use-daily-plan.ts`, `plan-view.ts`, `HojeScreen.tsx`)
- `src/features/reading/use-recent-sessions.ts`
- `src/features/queue/use-queue.ts`
- `src/components/ui/BookArt.tsx`
- `src/features/planner/engine/`, `docs/planner-algorithm.md`,
  `docs/adr/0013-motor-do-plano.md`, `docs/adr/0014-plano-recalculado-na-hoje.md`

## Armadilhas

- O motor devolve o plano **bruto**: não desconta o lido hoje. Quem compara é
  `buildPlanView`; depois de registrar, o bloco vira "Feito" sem o motor mudar.
- A janela do ativo é 0–6 dias de calendário; a volta leve é ≥ 3 dias e usa a
  última sessão de **qualquer** livro. Por isso `useRecentSessions` junta
  `listBetween` + `latest`; um `listBetween` de 7 dias sozinho perde a volta
  leve.
- `today` em `useDailyPlan` vira `dayStart` por ano/mês/dia: as dependências
  ficam estáveis durante o dia e o plano vira sozinho à meia-noite.
- O corte de arredondamento é 0,7 (não 0,5); a conta é inteira (`percentOf`).
- O teto de 60% é preferência: só vale com ativo e meta ≥ 10; meta < 10 é um
  livro só. `suggestion: true` só aparece com ativo.
- `pages_read` tem `CHECK` no banco: só o repositório de leitura escreve nele,
  na mesma transação da sessão.
- `create` recusa livro já concluído (`BOOK_ALREADY_FINISHED`). Registrar chama
  `notifyBooksChanged` e notifica as sessões, então Hoje, Estante, detalhe e
  Fila atualizam juntos.
- RNTL 14 é assíncrono: `await render(...)` e `await fireEvent.press(...)`.
  `renderWithProviders` aceita `readingRepository` criado sobre o mesmo
  `booksRepository`; para cenários com sessões, crie os dois e passe ambos.
- Import entre features: caminho direto, nunca o barril, para não recriar
  require cycle.
- `isbn-ranges.ts`, `drizzle/*.sql` e `drizzle/migrations.js` são gerados: não
  editar à mão. Depois de `drizzle-kit generate`, rodar `npm run lint:fix`.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
npx drizzle-kit generate      # depois de mudar src/db/schema.ts
npm run lint:fix              # normaliza migrations.js e o snapshot
```
