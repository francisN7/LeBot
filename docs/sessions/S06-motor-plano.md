# S06 — Motor do plano diário (funções puras)

## Objetivo

Dado um dia, a meta de páginas, a fila e o histórico recente, calcular um plano
determinístico de quantas páginas ler em cada livro — sem React Native, sem
banco, sem IA. A UI do plano é a S7.

## Fora de escopo

- Tela Hoje de verdade, persistência do plano e edição manual → **S7**.
- Reordenar ou reescrever a fila → **S8**.
- Estatísticas e gráficos → **S10**.
- Qualquer chamada de rede ou modelo de IA.

## Tarefas

1. `docs/planner-algorithm.md`: regras em PT-BR com exemplos de entrada/saída
   e a justificativa de cada uma (é o documento que explica o "anti-ressaca").
2. `src/features/planner/engine/`:
   - `types.ts` — `PlannerInput`, `PlannerBook`, `PlanEntry`, `Plan`, motivos
     (`active`, `queue`, `finish`, `light-day`, `no-books`).
   - `plan.ts` — `buildPlan(input): Plan`, puro, sincrônico, sem `Date.now` e
     sem `Math.random` (a data entra por parâmetro).
   - helpers puros de seleção/alternância de gênero, testáveis isoladamente.
3. Regras confirmadas pelo dono em 2026-10-31 (detalhes em
   `docs/planner-algorithm.md` e ADR 0013):
   - meta = `goal.pages` limitada a 3–200; inválida cai em 3;
   - meta < 10 não divide o dia: um livro leva a meta (o segundo só se o
     primeiro acabar);
   - livro ativo = `reading` com sessão mais recente nos últimos 7 dias
     (hoje + 6); sem ele, a fila decide;
   - `paused` e `finished` nunca entram;
   - no máximo 60% da meta num livro só, só com ativo e meta ≥ 10; o teto é
     flexível quando não há outro livro para receber a sobra;
   - alternar gênero quando o plano tiver mais de um livro;
   - nunca planejar além do restante (`pages - pagesRead`) de cada livro;
   - última sessão de qualquer livro há 3+ dias → meta a 70% ("volta leve");
   - sem livro disponível → plano vazio com motivo `no-books`;
   - blocos da fila com ativo são `suggestion: true` (leitura paralela).
4. Testes em `src/features/planner/engine/*.test.ts`: 75 casos, incluindo
   borda (meta 0/negativa, livro no fim, fila vazia, todos concluídos, sessão
   em outro fuso, livro que acaba no meio do plano).
5. Atualizar `docs/INDEX.md`, `docs/architecture.md`, `docs/testing.md` e
   registrar o contrato na ADR 0013.

## Aceite

- [x] `buildPlan` importa só `src/features/planner/engine/` e tipos — nenhum
      `react-native`, `@/db` ou `@/features` de UI.
- [x] Mesma entrada → mesma saída, sem depender de relógio global.
- [x] A soma do plano nunca passa da meta nem do restante de cada livro.
- [x] 75 testes verdes e `docs/planner-algorithm.md` com exemplos conferidos.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/roadmap.md`,
`docs/data-model.md` (tabela `reading_sessions` e `pages_read`),
`src/features/reading/types.ts`, `src/features/queue/FilaScreen.tsx` e
`src/features/today/`.

## Arquivos prováveis

- `docs/planner-algorithm.md` (novo)
- `src/features/planner/engine/` (novo)
- `src/features/today/` (só leitura, para entender o que a S7 vai consumir)

## Riscos

- **Regra de produto sem dono:** as porcentagens foram confirmadas pelo dono em
  2026-10-31 e registradas na ADR 0013.
- **Fuso e "hoje":** o dia da leitura é `read_at` local. O motor recebe a data
  já resolvida; não usar `new Date()` dentro dele.
- **Fila fictícia:** `src/features/queue/__fixtures__/queue.ts` ainda manda na
  Fila; a S6 não deve acoplar o motor à fixture — entrada é sempre tipada.
- **Persistência prematura:** nada de gravar plano no banco nesta sessão.

## Próximo depois desta

S7 — plano na UI e tela Hoje consumindo `buildPlan` (`docs/sessions/S07-*.md`).
