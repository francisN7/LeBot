# S05 — Registro de leitura e progresso

## Objetivo

Registrar uma sessão de leitura (quantas páginas foram lidas, quando) e ver o
progresso do livro refletido na Estante, no detalhe e na Fila — sem motor do
plano ainda.

## Fora de escopo

- Plano diário e sugestão de quantas páginas ler → **S6/S7**.
- Fila automática e reordenação → **S8**.
- Resenha e conclusão com texto → **S9**.
- Estatísticas e gráficos → **S10**.

## Tarefas

1. Tabela nova `reading_sessions` em `src/db/schema.ts`, migração aditiva
   (`npx drizzle-kit generate`), sem tocar nas tabelas existentes:
   - `id` text PK (`reading-<base36>` via `createId`);
   - `book_id` text, indexado;
   - `pages` integer > 0;
   - `read_at` integer (`timestamp_ms`), o dia da leitura;
   - `created_at` / `updated_at`.
2. Repositório `src/db/repositories/reading-sessions.ts`:
   - `listByBook(bookId)`, `listBetween(from, to)`, `create(input)`;
   - Zod recusando `pages <= 0` e livro inexistente;
   - `create` grava a sessão e soma em `books.pages_read` na mesma transação,
     com teto em `books.pages`; ao chegar no total, o status vira `finished`
     (pergunta ao dono antes de mudar sozinho? ver riscos);
   - `remove` (desfazer registro) subtrai o valor de `pages_read`, nunca abaixo
     de 0.
3. Hook `useReadingSessions` no padrão de `useBooks`/`useGenres`, exposto por
   `src/features/reading/index.ts`.
4. UI:
   - detalhe do livro: card "Progresso" com páginas lidas/total, barra e botão
     "Registrar leitura";
   - o botão "Começar" da Fila deixa de mostrar "Em breve" e abre o mesmo
     registro para a próxima parada;
   - registro simples: campo numérico de páginas (default = páginas restantes
     até o plano, ou 1), atalhos `+1`/`+10`, `Cancelar`/`Salvar`;
   - lista curta das últimas sessões do livro (data + páginas).
5. Testes:
   - repositório: grava, soma, teto, status `finished`, remover desconta, Zod;
   - `ReadingForm`/tela: registrar válido, zero/negativo recusado;
   - detalhe/Fila: progresso aparece e o botão abre o registro.
6. Docs: `docs/data-model.md` (tabela e fonte da verdade do progresso),
   `docs/architecture.md` (feature `reading`), `docs/testing.md`.

## Aceite

- [x] Registrar N páginas atualiza o livro na hora, sem reiniciar o app.
- [x] `pages_read` nunca passa de `pages` e nunca fica negativo ao desfazer.
- [x] Livro que chega ao fim vira `finished` e aparece assim na Estante.
- [x] Migração aplica em banco já existente (S0–S4) sem perder dados.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [ ] Conferido no Android pelo dono.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/data-model.md`,
`src/db/schema.ts`, `src/db/repositories/books.ts`,
`src/features/library/BookDetailScreen.tsx`,
`src/features/queue/FilaScreen.tsx`, `docs/sessions/S02-persistencia.md`.

## Arquivos prováveis

- `src/db/schema.ts`, `src/db/repositories/reading-sessions.ts`, `drizzle/`
- `src/features/reading/` (novo), `src/features/library/BookDetailScreen.tsx`
- `src/features/queue/FilaScreen.tsx`, `src/test-utils/repositories.ts`

## Riscos

- **Duas fontes de progresso:** `books.pages_read` e a soma das sessões. A
  sessão é o histórico; `pages_read` é a coluna que as telas leem. Só o
  repositório escreve nas duas, na mesma transação, para não divergir.
- **Status automático:** virar `finished` sozinho pode surpreender. Se o dono
  preferir, o status só muda quando ele confirmar — decidir antes de codar e
  registrar em `CURRENT`.
- **Sessão maior que o restante:** fazer o clamp no repositório e avisar na UI,
  não silenciar.
- **Migração:** o banco do dono já tem dados; nada de `ALTER` destrutivo, e os
  testes rodam as migrações reais (`sql.js`).

## Próximo depois desta

S6 — motor do plano (`docs/planner-algorithm.md`), funções puras com 25+ testes.
