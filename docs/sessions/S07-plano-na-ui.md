# S07 — Plano na UI + tela Hoje

## Objetivo

A tela Hoje deixa de usar o plano fictício e mostra o plano do dia calculado por
`buildPlan`, com a meta real, os blocos por livro, a marca de volta leve e a
sugestão paralela. O dono consegue registrar a leitura de um bloco e ver o dia
avançar.

## Fora de escopo

- Reordenar a fila e a sugestão automática de ordem → **S8**.
- Estatísticas, sequência e gráficos → **S10**.
- Notificações e lembretes reais.
- Resenha e conclusão com texto → **S9**.
- Backup/exportação → **S11**.
- Mudar as regras do motor: qualquer ajuste vai para `docs/planner-algorithm.md`,
  para o motor e para os testes da S6.

## Decisões a confirmar no início

1. **Persistir o plano do dia?** O motor é determinístico. Opções:
   - **(a) recalcular a cada abertura** (sem tabela); edição manual não
     sobrevive ao dia;
   - **(b) gravar `daily_plans` + blocos** para congelar o dia e permitir
     edição;
   - **(c) recalcular, mas guardar um "plano aprovado" em `settings`.**
   Recomendo (a) nesta sessão; persistência/edição vira **S7.1** se for
   prioridade. A spec da S6 previa persistência na S7 — confirmar com o dono.
2. **Edição manual:** trocar livro/páginas, remover bloco ou apenas
   "recalcular"?
3. **Sugestão paralela:** mostrar os blocos `suggestion` abaixo dos principais,
   com rótulo "sugestão", ou esconder atrás de um toque?

## Tarefas

1. `src/features/today/`:
   - montar `PlannerInput` com `today`, `useBooks`, `useSettings`, as sessões
     recentes e a ordem da fila; chamar `buildPlan` em um hook
     (`use-daily-plan.ts`) e remover `dailyPlan` da tela;
   - expor no `src/features/reading/` um hook de sessões recentes (janela de
     pelo menos 7 dias) usando `listBetween`, no padrão de refresh dos outros
     hooks;
   - a ordem da fila vem de um `queueBookIds` da feature `queue` (hoje a
     fixture; a S8 troca pela fila real). Não copiar a fixture para `today`.
2. Cartão da meta: `goal`/`baseGoal`, aviso de volta leve e, quando a meta for
   menor que 10, o texto de que o dia costuma render um livro só.
3. Blocos: capa/lombada, título, gênero, páginas, selo "sugestão" e estado
   feito/agora/depois comparando com as sessões de hoje; toque abre o
   `ReadingForm` com `defaultPages` do bloco e `remaining` do livro.
4. Plano vazio: estado com o mascote e CTA para a Fila (ou para começar um
   "Quero ler").
5. Testes de tela: ativo + sugestão, volta leve, meta < 10, sem livros,
   registrar a partir do bloco e atualizar o progresso na hora.
6. Atualizar `docs/architecture.md`, `docs/testing.md`, `docs/data-model.md`
   (se houver tabela), `docs/state/CURRENT.md`, `docs/roadmap.md` e
   `CHANGELOG.md`.

## Aceite

- [ ] Hoje mostra o plano real; nenhum `dailyPlan` fictício sobrou.
- [ ] Meta, volta leve e sugestão vêm do motor; a UI não duplica as regras.
- [ ] Registrar um bloco atualiza o progresso e o estado do dia na hora, sem
      reiniciar.
- [ ] Sem livros, a tela explica o vazio e leva à Fila.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec,
`docs/planner-algorithm.md`, `docs/data-model.md`,
`src/features/planner/engine/types.ts`, `src/features/today/`,
`src/features/reading/`, `src/features/queue/`,
`src/features/library/use-books.ts` e `src/features/settings/use-settings.tsx`.

## Arquivos prováveis

- `src/features/today/HojeScreen.tsx`, `use-daily-plan.ts` (novo)
- `src/features/today/__fixtures__/daily-plan.ts` (sai ou fica só em teste)
- `src/features/reading/use-recent-sessions.ts` (novo)
- `src/db/schema.ts` + migração (só se persistir o plano)

## Riscos

- **Segunda fonte de verdade:** persistir o plano sem decidir quem manda no
  progresso pode divergir de `pages_read`/sessões. Recalcular é mais simples.
- **Fuso:** `today` é `new Date()` na tela; o motor usa o dia local. Não passar
  string UTC.
- **Fila fictícia:** a S7 passa os ids da fixture; a S8 troca. Não deixar a
  fixture dentro do motor.
- **Janela de sessões:** cobrir 7 dias para o ativo **e incluir a última sessão
  geral mesmo se for mais antiga**, senão a volta leve de 30 dias some. Não basta
  um `listBetween` de 7 dias; `listBetween` já ordena por `readAt`.
- **Meta sem edição:** Ajustes ainda é só leitura; a tela usa 18 (seed) quando
  `goal.pages` não existe e não quebra com valor inválido.

## Próximo depois desta

- Se persistência/edição ficar para depois: **S7.1** — plano persistido e
  edição manual.
- Caso contrário: **S8** — fila real e ordem anti-ressaca.
