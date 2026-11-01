# ADR 0015 — Registrar leitura retoma livro pausado ou na fila

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S7 (revisão) / S7.1

## Contexto

A ADR 0012 decidiu que só `reading` vira `finished`; `queued` e `paused` ficavam
como estavam ao registrar páginas. Na revisão da S7, o dono registrou 10 páginas
na Coraline (pausada) e ela não virou "lendo" nem entrou no plano do dia — o
motor exclui `paused`. O comportamento documentado estava correto, mas errado
para o uso: quem registra leitura está lendo.

## Decisão

Ao criar uma sessão, o repositório de leitura define o status na mesma
transação:

- livro chega ao total → `finished`;
- qualquer outro caso (`queued`, `paused` ou `reading`) → `reading`.

Desfazer a sessão não restaura o status anterior: ele não é guardado. Se o dono
quiser pausar de novo, ajusta no livro. A regra de conclusão automática e a
volta de `finished` para `reading` ao desfazer continuam como na ADR 0012.

Esta decisão **supersede** o terceiro item de "Status automático, simétrico" da
ADR 0012 ("`queued` e `paused` não mudam sozinhos ao registrar páginas").

## Consequências

- Registrar na Coraline a coloca em `reading` e, como a sessão é de hoje, ela
  passa a ser o livro ativo do plano na hora (a sessão mais recente vence).
- Livro da fila que foi lido deixa de parecer "nunca começado" na Estante e na
  Fila; o histórico explica o progresso.
- A UI não precisa de diálogo de confirmação: o status muda junto com a sessão.
- Testes novos no repositório: `paused` → `reading`, `queued` → `reading`,
  sessão que conclui → `finished` e desfazer sem reversão.
- O repositório em memória dos testes de tela repete a mesma regra.

## Alternativas descartadas

- **Só `paused` retoma:** deixaria a mesma inconsistência para livro da fila.
- **Confirmar o status na UI:** mais um passo para uma consequência óbvia de
  "registrei que li".
- **Guardar o status anterior para desfazer:** coluna nova e uma regra a mais
  para um caso raro; pausar de novo é um ajuste manual simples.
