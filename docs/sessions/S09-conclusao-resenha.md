# S09 — Conclusão + resenha

## Objetivo

Ao concluir um livro, o dono registra uma resenha (nota, texto e citação), pode
preencher campos extras configurados e revê tudo no detalhe. A resenha sobrevive
se o livro for reaberto.

## Decisões fechadas

1. **Tabela própria `reviews`** (`book_id` PK, `rating` 1–5, `text`, `quote`,
   `extras` JSON), migração aditiva `0006`. `books` continua sendo a ficha.
2. **`quote` é coluna fixa**, pensando na galeria de citações que ficou no
   backlog; não virou campo extra.
3. **`review_fields`** guarda os campos extras globais (nome, ordem), criados em
   Ajustes e usados por todas as resenhas.
4. **Valores em `extras` JSON** por `field_id`, validados com Zod; campo vazio
   não grava chave. Foi a escolha pensando no backup (S11): uma linha de
   `reviews` viaja com tudo, sem join, e um import antigo recupera até chaves de
   campos excluídos.
5. **Abertura:** concluir pela sessão de leitura abre a resenha; concluir pela
   roda/edição mostra o CTA no detalhe, sem camada sobre o gesto. Reconcluir
   abre preenchida.
6. **Nota obrigatória; texto, citação e extras opcionais.** "Agora não" sai sem
   bloquear a conclusão. Salvar é upsert.
7. **Reabrir preserva** a resenha (oculta enquanto não estiver `finished`).
8. **Exclusão:** excluir o livro apaga a resenha na transação de `books.remove`;
   excluir um campo limpa a chave nos extras de todas as resenhas.
9. **Estante:** selo `★★★★` (leitura) só em concluído com resenha.
10. **Campos na UI:** chips abaixo do texto, em acordeão; abrir um recolhe o
    anterior sem perder o texto digitado.

## Entregue

- `src/db/schema.ts`: `reviews` e `review_fields` com índices/`CHECK`;
  `drizzle/0006_lame_warbound.sql` gerada.
- `src/db/repositories/reviews.ts`: `list`, `findByBook`, `save` (upsert),
  `remove`, `stripField`; `review-fields.ts`: `list`, `findById`, `create`,
  `rename`, `remove` (com limpeza nos extras).
- `src/db/repositories/books.ts`: exclusão apaga a resenha na mesma transação.
- `src/features/reviews/`: `ReviewFormScreen`, `ReviewCard`, `types.ts` e hooks
  `useReview`, `useReviews`, `useReviewFields` (com assinatura por repositório).
- `src/components/ui/RatingStars.tsx` e `TextField` com `multiline`.
- Rota `/livro/[id]/resenha`; detalhe com card/estado vazio e abertura automática
  ao concluir pela leitura, no detalhe **e na Hoje**; selo na Estante.
- Correções do aceite: a Hoje também abre a resenha; o selo ocupa slot de altura
  fixa para não desalinhar a grade; baixar as páginas lidas de um concluído
  reabre o livro, e um livro em `reading` no fim não é rotulado como concluído
  (adendo S9 da ADR 0018).
- Ajustes: `ReviewFieldsCard` com criar, renomear, excluir e sugestões ("O que
  melhorar?", "O que não gostei?", "Que repertório me deu?", "Para quem indico?").
- Repositórios em memória e `renderWithProviders` com as duas injeções novas.
- Docs: ADR 0019, `architecture.md`, `data-model.md`, `design-system.md`,
  `testing.md`, `CURRENT.md`, `roadmap.md` e `CHANGELOG.md`.

## Fora de escopo

- Compartilhar/exportar resenha para redes → backlog pós-MVP.
- Estatísticas agregadas de notas → S10.
- Resenha de livro não concluído.
- Galeria de citações → backlog pós-MVP (coluna `quote` já pronta).
- API externa de sinopse, capa ou citações.
- Edição em lote de resenhas.

## Aceite

- [x] Livro concluído permite nota 1–5, texto e citação; salvar persiste no SQLite.
- [x] Reabrir o app mantém a resenha e o detalhe a mostra.
- [x] Editar a resenha atualiza a tela na hora.
- [x] Concluir por sessão abre a resenha (detalhe e Hoje); concluir pela roda
      oferece o CTA.
- [x] "Agora não" não bloqueia a conclusão nem some com o progresso.
- [x] Reabrir o livro preserva a resenha (oculta) e concluir de novo a reusa.
- [x] Excluir o livro apaga a resenha.
- [x] Baixar as páginas lidas de um livro concluído reabre o livro; trocar de
      status sem mexer nas páginas persiste.
- [x] Livro em leitura no fim do progresso não é chamado de "concluído" e
      explica como continuar.
- [x] Campos extras podem ser criados, renomeados e excluídos em Ajustes; os
      valores somem junto com o campo.
- [x] Chips abrem em acordeão e só os preenchidos aparecem no detalhe.
- [x] Selo `★★★★` na Estante só em concluído com resenha, sem desalinhar a
      grade.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [x] Conferido no Android em 2026-11-01.

## Contexto necessário para retomar

`AGENTS.md`, `docs/state/CURRENT.md`, `docs/adr/0019-resenha-e-campos-extras.md`,
`src/db/schema.ts`, `src/db/repositories/reviews.ts`, `review-fields.ts`,
`src/features/reviews/`, `src/features/library/BookDetailScreen.tsx`,
`src/features/settings/ReviewFieldsCard.tsx` e `src/test-utils/repositories.ts`.

## Riscos e mitigação

- **Conclusão em dois caminhos:** só a sessão abre automaticamente; roda/edição
  usa CTA. O gatilho usa `write.book.status`, devolvido pelo repositório.
- **Resenha obrigatória:** nunca bloqueia a conclusão; "Agora não" é explícito e
  testado.
- **Reabrir sem perder texto:** a linha não é apagada ao voltar para `reading`;
  a UI só a esconde.
- **Migração aditiva:** tabelas novas; nenhum livro reescrito.
- **Órfãs:** livro → resenha na transação; campo → extras na exclusão. Testado
  no SQLite real e no repositório em memória.
- **JSON pouco consultável:** aceito; nota e citação ficam em colunas.

## Próximo depois desta

**S10** — estatísticas e insights.
