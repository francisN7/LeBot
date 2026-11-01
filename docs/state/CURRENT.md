# Estado atual

## Sessão

- **Atual:** S6 concluída; motor puro do plano diário entregue e testado.
- **Última concluída:** S6. Antes: S5 + auditoria de docs + hardening de CI.
- **Próxima:** S7 (`docs/sessions/S07-plano-na-ui.md`), consumir `buildPlan` na
  tela Hoje.

## Pronto (S6 — motor do plano)

- `src/features/planner/engine/`: `buildPlan` puro (sem React Native, banco,
  relógio global ou IA), com `types`, `constants`, `day`, `rounding` e
  `selection`; barril em `src/features/planner/index.ts`.
- Regras confirmadas pelo dono: meta 3–200 (inválida → 3); meta < 10 não divide
  o dia; livro ativo = `reading` com sessão nos últimos 7 dias (hoje + 6); sem
  ativo, a fila decide; volta leve (última sessão há 3+ dias) reduz a meta a
  70%; `paused`/`finished` nunca entram; teto de 60% só com ativo e meta ≥ 10,
  flexível quando não há outro livro; alternância de gênero; arredondamento com
  corte em 0,7 (fração > 0,7 sobe); plano bruto (não desconta o lido hoje).
- Saída: `Plan` com `date`, `baseGoal`, `goal`, `pages`, `entries` (`source`,
  `finishes`, `suggestion`), `lightDay` e `emptyReason`.
- `queueBookIds` é a ordem da fila: a S7 passa a fixture atual e a S8 a fila
  real. O motor não conhece fixture.
- 75 testes novos (282 na suíte); `docs/planner-algorithm.md` e ADR 0013.
- `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.

## Decisões abertas

- S7: persistir o plano do dia + edição manual ou recalcular a cada abertura —
  decidir no início da sessão (spec S07).
- Excluir livro deixa `reading_sessions` órfãs (sem FK). Limpeza na S9/S11.
- `queued`/`paused` não viram `reading` ao registrar páginas; só `reading` vira
  `finished`. Ajustar na S9 se incomodar.

## Arquivos-chave

- `src/features/planner/engine/` (`plan.ts`, `selection.ts`, `rounding.ts`,
  `day.ts`, `types.ts`, `constants.ts`)
- `src/features/planner/index.ts`
- `docs/planner-algorithm.md`, `docs/adr/0013-motor-do-plano.md`
- `src/features/planner/engine/*.test.ts`

## Armadilhas

- O corte de arredondamento é 0,7, não 0,5; a conta é inteira (`percentOf`),
  não float.
- A janela do ativo é 0–6 dias de calendário; 7 dias já não é ativo. A volta
  leve é ≥ 3 dias e usa a última sessão de qualquer livro.
- O teto de 60% é preferência: só vale com ativo e meta ≥ 10; o último bloco
  pode completar a meta. Meta < 10 é um livro só.
- `suggestion: true` só aparece com ativo; sem ativo, a fila é o plano.
- O plano é bruto: não desconta as páginas lidas hoje. A UI (S7) compara.
- O motor não lê o relógio: `today` entra por parâmetro e o dia é local.
- `pages_read` tem `CHECK` no banco: só o repositório de leitura escreve nele,
  na mesma transação da sessão; sessão acima do restante guarda `pages` cheio e
  `appliedPages` menor.
- `create` recusa livro já concluído (`BOOK_ALREADY_FINISHED`). Registrar chama
  `notifyBooksChanged`, então Estante, detalhe, Fila e plano atualizam juntos.
- RNTL 14 é assíncrono: `await render(...)` e `await fireEvent.press(...)`.
  `renderWithProviders` injeta o repositório de leitura ligado ao de livros.
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
