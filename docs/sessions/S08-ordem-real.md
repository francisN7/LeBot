# S08 — Ordem real e sugestão anti-ressaca

## Objetivo

A Ordem deixa de ser fixture: o dono coloca livros na ordem, reordena, a sequência
persiste no aparelho e a tela Hoje passa a montar o plano nessa ordem. Um botão
sugere uma ordem anti-ressaca que alterna gêneros.

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

## Decisões a confirmar no início

1. **Modelo da ordem (feature `queue`).** Recomendo `queue_items` (`book_id` PK,
   `position`, `note` opcional, timestamps) + migração aditiva `0005`. A
   alternativa é uma coluna `queue_position` em `books`, que mistura ordem com o
   livro e dificulta reordenar em transação única.
2. **O que entra na Ordem.** Opções: (a) só livros `queued`; (b) qualquer livro
   não concluído, com o status decidindo o que o motor vê; (c) qualquer livro
   `queued` ou `paused`. Recomendo (b): a Ordem é a intenção do dono, e o motor já
   ignora `paused`/`finished`. Confirmar o que acontece ao adicionar um livro
   `paused` (volta para `queued`?) e ao removê-lo.
3. **Reordenar:** arrastar é o caminho principal (decidido pelo dono em
   2026-11-01, dentro da própria S8); setas ↑/↓ ficam como alternativa
   acessível. Medir o custo com `react-native-gesture-handler` + Reanimated
   antes de fechar a interação.
4. **"Sugerir ordem":** aplicar direto na Ordem (reversível reordenando) ou
   mostrar uma prévia antes de gravar. Recomendo aplicar direto, com o botão
   desabilitado quando a ordem sugerida já é a atual.
5. **Registro de leitura:** fica só na Hoje (S7.1). A Ordem não ganha "Começar"
   nem modal de volta; o toque no item abre o detalhe do livro.

## Tarefas

1. `src/db/schema.ts`: tabela da ordem escolhida + `npx drizzle-kit generate`
   (migração aditiva) + `npm run lint:fix`.
2. `src/db/repositories/queue.ts`: `list`, `add`, `remove`, `move` e
   `replaceAll` (ordem em transação única), com Zod e testes no `sql.js`.
3. `src/features/queue/use-queue.ts`: trocar a fixture pelo repositório, com
   assinatura de refresh no padrão de `useBooks`. Remover
   `__fixtures__/queue.ts` e o export `queue`; ajustar `QueueScreen` e testes.
4. `src/features/queue/suggest-order.ts`: função pura que alterna gênero
   (mesma regra do motor), preserva todos os livros e é determinística; testes
   de borda (um livro, todos do mesmo gênero, ordem vazia, gêneros repetidos).
5. `QueueScreen`: lista real, adicionar (do detalhe/estante ou de um seletor na
   própria Ordem), remover com confirmação, arrastar para reordenar (com setas
   ↑/↓ como alternativa acessível) e "Sugerir ordem". Textos e estados vazios.
   Sem registro de leitura.
6. Hoje: nenhuma mudança de tela; conferir que reordenar muda os blocos na
   próxima abertura. Teste de integração Ordem → Hoje se a navegação permitir.
7. Atualizar `docs/architecture.md`, `docs/data-model.md`, `docs/testing.md`,
   `docs/state/CURRENT.md`, `docs/roadmap.md` e `CHANGELOG.md`; ADR nova para o
   modelo da ordem.

## Aceite

- [ ] Ordem lida do banco; reiniciar o app mantém a sequência.
- [ ] Reordenar por arrastar muda a ordem usada por `useQueueBookIds` e, por
      consequência, o segundo bloco da Hoje; a alternância acessível por setas
      faz o mesmo.
- [ ] Sugestão alterna gênero, não perde nem duplica livro e é idempotente.
- [ ] Ordem vazia explica o vazio e leva a adicionar um livro.
- [ ] Nenhuma fixture de ordem sobrou no código.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/data-model.md`,
`docs/planner-algorithm.md`, ADR 0013, ADR 0014,
`src/features/queue/`, `src/features/today/use-daily-plan.ts`,
`src/features/planner/engine/selection.ts` e `src/db/schema.ts`.

## Arquivos prováveis

- `src/db/schema.ts` + `drizzle/0005_*.sql`
- `src/db/repositories/queue.ts` (novo) e `queues` no barril
- `src/features/queue/QueueScreen.tsx`, `use-queue.ts`, `suggest-order.ts`
- `src/components/ui/QueueRow.tsx` (se a linha arrastável justificar um
  componente próprio) e o gesto com `react-native-gesture-handler`
- `src/test-utils/repositories.ts` (ordem em memória)
- `src/features/library/BookDetailScreen.tsx` (se "adicionar à ordem" entrar ali)

## Riscos

- **Ordem sem posição única:** gravar posições com buracos ou empates quebra o
  determinismo da Hoje. `move` e `replaceAll` reescrevem a lista inteira numa
  transação.
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
- **S8b** — multisseleção na Estante (`S08b-multisselecao-estante.md`).
- Depois: **S9** — conclusão + resenha.
