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
3. Regras iniciais (a confirmar com o dono no início da sessão):
   - meta = `goal.pages` limitada a 1–200;
   - livro ativo = `reading` com sessão mais recente nos últimos 7 dias; sem
     ele, o primeiro da fila que não esteja `finished`;
   - no máximo 60% da meta num livro só, salvo se ele estiver a menos disso do
     fim;
   - alternar gênero quando o plano tiver mais de um livro;
   - nunca planejar além do restante (`pages - pagesRead`) de cada livro;
   - dois dias sem sessão → meta reduzida a 70% ("volta leve");
   - sem livro disponível → plano vazio com motivo `no-books`.
4. Testes em `src/features/planner/engine/*.test.ts`: 25+ casos, incluindo
   borda (meta 0/negativa, livro no fim, fila vazia, todos concluídos, sessão
   em outro fuso, livro que acaba no meio do plano).
5. Atualizar `docs/INDEX.md`, `docs/architecture.md` e `docs/testing.md`.

## Aceite

- [ ] `buildPlan` importa só `src/features/planner/engine/` e tipos — nenhum
      `react-native`, `@/db` ou `@/features` de UI.
- [ ] Mesma entrada → mesma saída, sem depender de relógio global.
- [ ] A soma do plano nunca passa da meta nem do restante de cada livro.
- [ ] 25+ testes verdes e `docs/planner-algorithm.md` com exemplos conferidos.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.

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

- **Regra de produto sem dono:** as porcentagens acima são proposta. Confirmar
  com o dono antes de codar e registrar a decisão em ADR se mudar.
- **Fuso e "hoje":** o dia da leitura é `read_at` local. O motor recebe a data
  já resolvida; não usar `new Date()` dentro dele.
- **Fila fictícia:** `src/features/queue/__fixtures__/queue.ts` ainda manda na
  Fila; a S6 não deve acoplar o motor à fixture — entrada é sempre tipada.
- **Persistência prematura:** nada de gravar plano no banco nesta sessão.

## Próximo depois desta

S7 — plano na UI e tela Hoje consumindo `buildPlan` (`docs/sessions/S07-*.md`).
