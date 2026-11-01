# Estado atual

## Sessão

- **Atual:** S7 concluída e revisada no Android; a revisão do dono abriu a S7.1.
- **Última concluída:** S7. Antes: S6 + auditoria de docs + hardening de CI.
- **Próxima:** S7.1 (`docs/sessions/S07.1-ajustes-hoje-fila.md`): status ao
  registrar, Hoje antes da Fila e Fila somente ordem.
- **Depois:** S8 (`docs/sessions/S08-fila-real.md`), fila persistida/reordenável.

## Pronto (S7 — plano na UI)

- `useDailyPlan` monta o `PlannerInput` com `useBooks`, `useSettings`,
  `useRecentSessions(7, hoje)` e `useQueueBookIds`, chama `buildPlan` e entrega
  `plan` + `view`. `plan-view.ts` (puro) cruza com o dia: páginas por livro,
  feito/agora/depois, mensagem e mascote. Nenhuma regra do motor é duplicada.
- `useRecentSessions` = janela de 7 dias (`listBetween`) **mais** `latest()`,
  então a volta leve funciona com a última sessão há meses.
- Hoje: meta + aviso de volta leve/meta < 10, cartão do LêBot, blocos com
  `BookArt`, gênero, páginas, selo "sugestão"/"fecha o livro", chip
  Feito/Agora/Depois e registro pelo `ReadingForm`. Vazio: mascote + "Ver a
  fila".
- Plano **não é persistido** (ADR 0014). `BookArt` saiu da Fila para
  `src/components/ui/`; a fixture `today/__fixtures__/daily-plan.ts` saiu.
- 13 testes novos (295 na suíte, 40 arquivos); lint, typecheck, test, doctor e
  export verdes.

## Decisões da revisão (para a S7.1)

- **Status:** sessão em livro `paused`/`queued` coloca em `reading` (ou
  `finished`, se fechar). Desfazer não restaura o status anterior. ADR 0015
  supersede parte da ADR 0012.
- **Papéis:** Hoje manda na ação (plano + "Lido hoje"); Fila só mostra a ordem
  dos próximos. Só a S8 devolve escrita à Fila.
- **Abas:** Estante, Hoje, Fila, Ajustes.
- **Copy:** Hoje "Seu plano de hoje" / "Plano do dia" / "Lido hoje"; Fila "A
  ordem dos próximos livros" / "Na ordem"; meta sem fração acima de 100%;
  blocos com botão explícito "Registrar leitura".
- **Fila agora:** continua fixture e somente leitura; sem páginas, "Começar" ou
  modal. A S8 troca pela fila real.
- **(i) de ajuda + mascote confuso:** backlog pós-S12.

## Decisões abertas

- S7.2 (opcional): persistir o plano + edição manual. Hoje o dia é recalculado.
- S8: modelo da fila (`queue_items` × coluna em `books`), o que entra e como
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
- Ativo = `reading` com sessão em 0–6 dias; volta leve = ≥ 3 dias e usa a
  última sessão de qualquer livro. Um `listBetween` de 7 dias sozinho perde a
  volta leve — por isso o `latest()`.
- `today` vira `dayStart` (ano/mês/dia) em `useDailyPlan`: deps estáveis e o dia
  vira sozinho à meia-noite. O motor não lê relógio.
- Corte de arredondamento 0,7; conta inteira (`percentOf`). Teto de 60% só com
  ativo e meta ≥ 10; meta < 10 é um livro só.
- `pages_read` tem `CHECK`: só o repositório de leitura escreve, na mesma
  transação. `create` recusa livro concluído e chama `notifyBooksChanged`.
- `ReadingForm`/`useReadingSessions` refrescam Estante, detalhe, Fila e Hoje.
- RNTL 14 é assíncrono (`await render` / `await fireEvent.press`). Para cenários
  com sessões, crie `booksRepository` + `readingRepository` sobre ele e passe os
  dois ao `renderWithProviders`.
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
