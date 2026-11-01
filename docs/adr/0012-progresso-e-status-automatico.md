# ADR 0012 — Progresso de leitura: histórico separado e status automático

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S5

## Contexto

A S5 precisava registrar quantas páginas o dono leu e refletir isso na Estante,
no detalhe e na Fila. Duas perguntas apareceram:

1. de onde vem o progresso: da coluna `books.pages_read` ou da soma das sessões?
2. o que acontece quando a leitura chega ao total e quando o dono erra o valor?

Restrições:

- o banco do dono já tem livros e o `CHECK (pages_read BETWEEN 0 AND pages)`
  existe desde a S2 — qualquer inconsistência estoura como exceção;
- não há FK, então o histórico pode ficar órfão;
- as telas precisam atualizar sem reiniciar o app;
- a UI não pode engolir o erro de digitar mais páginas do que faltam.

## Decisão

### `reading_sessions` é o histórico; `pages_read` é o que as telas leem

- Tabela nova, aditiva (`0003`), com `book_id` indexado, `pages` > 0 e
  `read_at` (dia da leitura).
- `books.pages_read` continua sendo a coluna de leitura rápida mostrada na
  Estante, no detalhe e na Fila. Somar sessões em cada tela seria lento e
  abriria espaço para divergência.
- **Só** `createReadingSessionsRepository` escreve nas duas, na mesma
  transação. Nenhum outro módulo soma páginas.

### Sessão maior que o restante: grava o histórico, limita o progresso

- `session.pages` guarda o valor digitado (histórico fiel).
- `pages_read` recebe `min(pages, restante)`; o retorno traz `appliedPages`.
- A coluna `applied_pages` (S5.1, migração `0004`) guarda esse valor aplicado;
  desfazer desconta `applied_pages`, não `pages`, e as linhas antigas com `NULL`
  valem como `pages`.
- A UI compara e avisa **antes** de salvar: "Só faltam N páginas: o progresso
  para no fim do livro." Nada é truncado em silêncio.
- Sessão em livro já concluído é recusada no repositório, não na tela.

### Status automático, simétrico

- Ao chegar ao total, `status` vira `finished` na mesma transação (decisão do
  dono na abertura da S5).
- Desfazer a sessão que concluiu o livro volta o status para `reading`, para
  não existir "Concluído" com 90%.
- `queued` e `paused` não mudam sozinhos ao registrar páginas: só `reading` é
  promovido a `finished`. Quem estava na fila e foi lido sem trocar o status
  continua `queued` até o dono ajustar.
- Conclusão com resenha continua na S9; a S5 só muda o status.

### O histórico manda no piso do progresso (S5.1)

- Editar "Páginas lidas" não pode ir abaixo da soma de `applied_pages` das
  sessões: o histórico deixaria de explicar o número.
- A trava é dupla — validação no formulário (`validateBookForm`) com aviso, e
  guarda no repositório de livros para quem chamar a API direto.
- Para reduzir, o caminho é desfazer os registros no detalhe do livro.

## Consequências

- Progresso e histórico nunca divergem por escrita de tela; se divergirem, o
  culpado é um `UPDATE` fora do repositório.
- Excluir um livro deixa as sessões órfãs (sem FK). Isso não afeta a barra nem
  o status; a limpeza entra com conclusão/resenha (S9) ou no backup (S11).
- `listBetween` já entrega a base das estatísticas da S10.
- O hook `useReadingSessions` avisa `useBooks` (`notifyBooksChanged`), então o
  progresso aparece na hora em qualquer tela montada.

## Alternativas descartadas

- **Somar sessões na leitura:** cada tela faria agregação própria e a Fila
  ficaria lenta; a coluna `pages_read` já existia e é a fonte da UI.
- **Recusar sessão acima do restante:** o dono perderia o registro real; o
  clamp com aviso preserva o histórico.
- **Só confirmar a conclusão na UI:** mais um diálogo para uma ação que o dono
  já pediu ao registrar as últimas páginas.
- **Não mexer no status ao desfazer:** deixaria livro "Concluído" com menos
  páginas lidas que o total.
- **FK com `ON DELETE CASCADE`:** SQLite exigiria recriar `books`; a migração
  tem de ser aditiva.
