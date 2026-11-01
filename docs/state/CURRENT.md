# Estado atual

## Sessão

- **Atual:** S7 concluída e revisada no Android; a revisão do dono abriu a S7.1.
- **Última concluída:** S7. Antes: S6 + auditoria de docs + hardening de CI.
- **Próxima:** S7.1 (`docs/sessions/S07.1-ajustes-hoje-ordem.md`): status ao
  registrar, Hoje antes da Ordem, Fila → Ordem e blocos com ação explícita.
- **Depois:** S8 (`docs/sessions/S08-ordem-real.md`), Ordem persistida e
  reordenável.

## Pronto (S7 — plano na UI)

- `useDailyPlan` monta o `PlannerInput` e chama `buildPlan`; `plan-view.ts`
  (puro) cruza com o dia: páginas por livro, feito/agora/depois, mensagem e
  mascote. Nenhuma regra do motor é duplicada.
- `useRecentSessions` = janela de 7 dias (`listBetween`) **mais** `latest()`: a
  volta leve funciona com a última sessão há meses.
- Hoje: meta + volta leve, cartão do LêBot, blocos com `BookArt`, gênero,
  páginas, selos de sugestão/fim e registro pelo `ReadingForm`. Vazio: mascote +
  "Ver a fila".
- Plano **não é persistido** (ADR 0014); `BookArt` foi para
  `src/components/ui/` e a fixture `today/__fixtures__/daily-plan.ts` saiu.
- 295 testes (40 arquivos); lint, typecheck, test, doctor e export verdes.

## Decisões da revisão (para a S7.1)

- **Status:** sessão em livro `paused`/`queued` coloca em `reading` (ou
  `finished`, se fechar). Desfazer não restaura o status anterior. ADR 0015
  supersede parte da ADR 0012.
- **Papéis:** Hoje manda na ação (plano + "Lido hoje"); a **Ordem** (antiga
  Fila) só mostra a sequência dos próximos. Só a S8 devolve escrita à Ordem.
- **Nome:** "Fila" → **"Ordem"** na UI; rota e componente também mudam
  (`ordem.tsx`, `QueueScreen`). A feature interna `queue` e `useQueueBookIds`
  ficam (código em inglês).
- **Abas:** Estante, Hoje, Ordem, Ajustes.
- **Copy:** Hoje "Seu plano de hoje" / "Plano do dia" / "Lido hoje"; Ordem com
  legenda **a decidir na abertura** (candidatas na spec S07.1) e seção "Na
  ordem"; meta sem fração acima de 100%; botão explícito "Registrar leitura".
- **Ordem agora:** continua fixture e somente leitura; sem páginas, "Começar" ou
  modal. A S8 troca pela ordem real.
- **(i) de ajuda + mascote confuso:** backlog pós-S12.

## Decisões abertas

- S7.2 (opcional): persistir o plano + edição manual. Hoje o dia é recalculado.
- S8: modelo da Ordem (`queue_items` × coluna em `books`), o que entra e como
  reordenar (setas × arrastar) — decidir na abertura (spec S08).
- Excluir livro deixa `reading_sessions` órfãs (sem FK). Limpeza na S9/S11.

## Arquivos-chave

- `src/features/today/` (`use-daily-plan.ts`, `plan-view.ts`, `HojeScreen.tsx`)
- `src/features/reading/use-recent-sessions.ts`, `src/features/queue/use-queue.ts`
- `src/components/ui/BookArt.tsx`
- `docs/planner-algorithm.md`, ADR 0013, ADR 0014, ADR 0015

## Armadilhas

- O motor devolve o plano **bruto**: não desconta o lido hoje; `buildPlanView`
  compara.
- Ativo = `reading` com sessão em 0–6 dias; volta leve = ≥ 3 dias (última sessão
  de qualquer livro). Por isso `listBetween` + `latest()`.
- `useDailyPlan` fixa o dia por ano/mês/dia (`dayStart`); o motor não lê relógio.
- Corte de arredondamento 0,7; conta inteira (`percentOf`). Teto de 60% só com
  ativo e meta ≥ 10; meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve, na mesma
  transação. `create` recusa livro concluído e chama `notifyBooksChanged`.
- RNTL 14 é assíncrono; para cenários com sessões, passe `booksRepository` +
  `readingRepository` ligados ao `renderWithProviders`.
- Import entre features: caminho direto, nunca o barril (require cycle).
- `isbn-ranges.ts`, `drizzle/*.sql` e `drizzle/migrations.js` são gerados: não
  editar à mão; depois de `drizzle-kit generate`, rodar `npm run lint:fix`.

## Como rodar

```bash
npm install && npm start      # Expo Go
npm run lint && npm run typecheck && npm run test
npm run doctor && npx expo export --platform android --output-dir dist
npx drizzle-kit generate      # depois de mudar src/db/schema.ts
npm run lint:fix              # normaliza migrations.js e o snapshot
```
