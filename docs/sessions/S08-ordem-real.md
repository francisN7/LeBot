# S08 — Ordem real e sugestão anti-ressaca

## Objetivo

A Ordem deixa de ser fixture: todo livro não concluído entra automaticamente,
o dono só reordena, a sequência persiste no aparelho e a tela Hoje passa a montar
o plano nessa ordem. O primeiro Lendo é o principal. Um botão sugere uma ordem
anti-ressaca que alterna gêneros dentro de cada bloco.

> A S7.1 já deixou a Ordem somente leitura (sem registrar e sem páginas) e a Hoje
> como a única tela de registro. Aqui a Ordem ganha escrita de novo — só para
> montar e ordenar a sequência, nunca para registrar leitura.
>
> A legenda ("A sequência é sua: o que ler depois do livro atual.") e a contagem
> ("N livros depois do atual") ficam; a S8 acrescenta adicionar, remover e
> reordenar.

## Fora de escopo

- Persistir o plano e editar blocos → **S7.2**, só se o dono pedir.
- Estatísticas, sequência e gráficos → **S10**.
- Notificações e lembretes.
- Conclusão com resenha → **S9**.
- Backup/exportação → **S11**.
- Preservar a legenda e a identidade da Ordem da S7.1: a escrita volta só para
  montar a sequência.

## Decisões confirmadas na abertura (2026-11-01, revisadas na conferência)

- Tabela própria `queue_items` (não coluna em `books`).
- Ordem automática: entram todos os livros não concluídos; o status é a
  entrada/saída, sem adicionar/remover. Pausado mantém o status e avisa que fica
  fora do plano.
- Dois blocos: todos os `reading` no topo ("Lendo agora"), depois
  `queued`/`paused` ("Depois"). Arrastar/setas não cruzam os blocos.
- O primeiro Lendo é o principal (coroa) e o bloco `active` do plano. Livro que
  passa a Lendo entra no fim de "Lendo agora".
- Arrastar é o caminho principal, com setas ↑/↓ acessíveis.
- "Sugerir ordem" aplica direto, alternando gênero dentro de cada bloco.
- Registro de leitura fica só na Hoje (S7.1); a Ordem não ganha "Começar" nem
  modal, e o toque no item abre o detalhe.

> A abertura da S8 recomendava inclusão manual e "ativo" pela sessão mais
> recente; a conferência de 2026-11-01 substituiu por ordem automática e
> principal = primeiro Lendo. Ver ADR 0017.

## Tarefas

1. `src/db/schema.ts`: tabela da ordem escolhida + `npx drizzle-kit generate`
   (migração aditiva) + `npm run lint:fix`.
2. `src/db/repositories/queue.ts`: `list`, `sync`, `move` e `replaceAll` (ordem
   em transação única, dois blocos), com Zod e testes no `sql.js`.
3. `src/features/queue/use-queue.tsx`: trocar a fixture pelo repositório, com
   `sync` quando a estante muda e assinatura no padrão de `useBooks`. Remover
   `__fixtures__/queue.ts` e o export `queue`; ajustar `QueueScreen` e testes.
4. `src/features/queue/suggest-order.ts`: função pura que alterna gênero
   (mesma regra do motor), preserva todos os livros e é determinística; testes
   de borda (um livro, todos do mesmo gênero, ordem vazia, gêneros repetidos).
5. `QueueScreen`: lista automática nos blocos "Lendo agora"/"Depois", principal
   coroado, arrastar para reordenar (setas ↑/↓ acessíveis) sem cruzar blocos e
   "Sugerir ordem" por bloco. Sem adicionar/remover e sem registro de leitura.
6. Motor e Hoje: principal = primeiro Lendo da ordem; dois Lendo dividem a meta
   (11 + 7 no cenário Hobbit + Sapiens). Teste de integração Ordem → Hoje.
7. Atualizar `docs/architecture.md`, `docs/data-model.md`, `docs/testing.md`,
   `docs/planner-algorithm.md`, `docs/state/CURRENT.md`, `docs/roadmap.md` e
   `CHANGELOG.md`; ADR 0016 (tabela) e ADR 0017 (modelo automático).

## Aceite

- [x] Ordem automática: todo livro não concluído entra; reiniciar mantém a
      sequência e o status é a entrada/saída.
- [x] Dois blocos: Lendo no topo, queued/paused abaixo; arrastar/setas não
      cruzam. O primeiro Lendo é o principal.
- [x] Reordenar os Lendo troca o principal e o primeiro bloco da Hoje; dois
      Lendo dividem a meta (Hobbit 11 + Sapiens 7).
- [x] Sugestão alterna gênero por bloco, não perde nem duplica livro e é
      idempotente.
- [x] Ordem vazia explica que concluídos não entram; sem ação falsa.
- [x] Nenhuma fixture de ordem sobrou no código.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [ ] Conferido no Android: Hobbit 11 + Sapiens 7 na Hoje, coroa no primeiro
      Lendo, bloqueio de Quero ler no topo, toque longo na alça e arrastar no
      topo/fim de lista maior que a tela, rolagem vertical, animação das setas e
      setas com leitor de tela.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/data-model.md`,
`docs/planner-algorithm.md`, ADR 0013, ADR 0014, ADR 0017,
`src/features/queue/`, `src/features/today/use-daily-plan.ts`,
`src/features/planner/engine/selection.ts` e `src/db/schema.ts`.

## Arquivos prováveis

- `src/db/schema.ts` + `drizzle/0005_*.sql`
- `src/db/repositories/queue.ts` (novo) e `queue` no barril
- `src/features/queue/QueueScreen.tsx`, `QueueRow.tsx`, `use-queue.tsx`,
  `suggest-order.ts`
- `src/features/planner/engine/selection.ts` e `plan.ts` (principal)
- `src/test-utils/repositories.ts` (ordem em memória)
- `src/app/_layout.tsx` e `src/components/ui/Screen.tsx` (gesture handler)

## Riscos

- **Ordem sem posição única:** gravar posições com buracos ou empates quebra o
  determinismo da Hoje. `move` e `replaceAll` reescrevem a lista inteira numa
  transação.
- **Blocos:** `reading` precisa ficar todo acima de `queued`/`paused`. `move` e
  o arrastar têm que bloquear a travessia, senão o principal deixa de ser o
  primeiro Lendo.
- **Ordem automática × status:** `sync` precisa rodar quando a estante muda (novo
  livro, status, exclusão); sem isso a Ordem fica velha até reabrir o app.
- **Livro excluído:** `queue_items` sem FK (padrão do projeto) precisa ignorar
  ids órfãos na leitura, como a Ordem faz hoje.
- **Ciclo de import:** `queue` não pode importar `today`; a Hoje é quem depende
  da ordem, nunca o contrário.
- **Registro fora da Hoje:** a Ordem não pode recuperar "Começar"/modal (decisão
  da S7.1); o toque no item só abre o detalhe.
- **Testes de tela:** a Ordem em memória precisa refletir a mesma transação do
  repositório, senão o teste passa e o aparelho não.
- **Arrastar × rolagem:** o gesto de reordenar não pode roubar a rolagem
  vertical; conferir no Android com lista maior que a tela e item no topo/fim.
- **Arrastar × acessibilidade:** o arrastar sozinho não é operável por leitor de
  tela; manter as setas ↑/↓ com rótulo acessível.

## Próximo depois desta

- **S8a** — roda de troca rápida de status na Estante (`S08a-troca-rapida-status.md`).
- Depois: **S9** — conclusão + resenha.
