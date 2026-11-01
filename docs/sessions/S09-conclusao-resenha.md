# S09 — Conclusão + resenha

## Objetivo

Ao concluir um livro, o dono registra uma resenha (nota e texto), revê no
detalhe e mantém o histórico mesmo se reabrir o livro depois.

## Fora de escopo

- Compartilhar resenha ou exportar para redes → backlog pós-MVP.
- Estatísticas agregadas de notas → S10.
- Resenha de livro não concluído.
- Integração com API externa de sinopse, capa ou citações.
- Edição em lote de resenhas.

## Decisões a confirmar na abertura

1. **Onde mora.** Recomendo tabela própria `reviews` (`book_id` PK, `rating`,
   `text`, `quote`, timestamps) com migração aditiva `0006`, em vez de colunas em
   `books`: a resenha tem ciclo próprio e o livro continua sendo a ficha.
2. **Quando abre.** Recomendo abrir a tela de resenha ao concluir pela sessão de
   leitura (o momento em que o livro chega ao fim). Na roda de status, concluir
   sem sessão mostra o CTA "Escrever resenha" no detalhe/card, sem abrir outra
   camada em cima do gesto.
3. **Nota.** Recomendo 1–5 estrelas obrigatórias e texto opcional. "Salvar"
   fica desabilitado sem nota; o texto livre pode vir depois.
4. **Reabrir o livro.** Recomendo preservar a resenha ao voltar o status para
   `reading` e ocultá-la enquanto o livro não estiver concluído; concluir de novo
   reaproveita a mesma linha.
5. **Onde aparece.** Card "Resenha" no detalhe (estrelas + texto + editar) e um
   selo discreto no card da Estante. Decidir se a Estante mostra a nota.
6. **Exclusão.** Excluir o livro apaga a resenha na mesma operação, mesmo sem FK
   (`delete` explícito no repositório). Sessões órfãs continuam no backlog.

## Tarefas

1. **Schema:** `reviews` (`book_id` PK, `rating` 1–5, `text` opcional, `quote`
   opcional, `created_at`/`updated_at`) + migração `0006`; atualizar
   `docs/data-model.md`.
2. **Repositório:** `ReviewsRepository` com `findByBook`, `save` (upsert),
   `remove` e validação Zod; exclusão do livro limpa a resenha.
3. **Hook:** `useReview(bookId)` com assinatura para atualizar o detalhe e a
   Estante sem reiniciar.
4. **Tela:** formulário de resenha (estrelas, texto, citação opcional) no visual
   do app; rota `/livro/[id]/resenha` ou modal — decidir na abertura.
5. **Fluxo:** concluir pela sessão abre a resenha; concluir pela roda/edição
   mostra o CTA; "Agora não" permite resenhar depois.
6. **Detalhe:** card com estrelas, texto e ação "Editar resenha"; estado vazio
   para livro concluído sem resenha.
7. **Testes:** repositório (round-trip, upsert, rating inválido, exclusão em
   cascata manual), tela (salvar, editar, pular, reabrir) e fluxo de conclusão.
8. **Docs:** `architecture.md`, `design-system.md`, `testing.md`, `CURRENT.md`,
   `roadmap.md`, `CHANGELOG.md`; ADR para a decisão da tabela + reabertura.

## Aceite

- [ ] Livro concluído permite nota 1–5 e texto; salvar persiste no SQLite.
- [ ] Reabrir o app mantém a resenha e o detalhe a mostra.
- [ ] Editar a resenha atualiza a tela na hora.
- [ ] Concluir por sessão abre a resenha; concluir pela roda oferece o CTA.
- [ ] "Agora não" não bloqueia a conclusão nem some com o progresso.
- [ ] Reabrir o livro preserva a resenha (oculta) e concluir de novo a reusa.
- [ ] Excluir o livro apaga a resenha.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `src/db/schema.ts`,
`src/db/repositories/books.ts`, `reading-sessions.ts`,
`src/features/library/BookDetailScreen.tsx`,
`src/features/reading/ReadingProgressCard.tsx`,
`src/features/library/EstanteScreen.tsx`, `use-books.tsx`,
`docs/data-model.md` e ADRs 0007, 0012, 0015 e 0018.

## Arquivos prováveis

- `src/db/schema.ts`, `drizzle/0006_*.sql`, `src/db/repositories/reviews.ts`
- `src/features/reviews/` (tela, formulário, hook) ou dentro de `library`
- `src/features/library/BookDetailScreen.tsx`, `EstanteScreen.tsx`
- `src/features/reading/ReadingProgressCard.tsx` / `use-reading-sessions.ts`
- `src/test-utils/repositories.ts`, `render.tsx`
- `docs/architecture.md`, `docs/data-model.md`, `docs/design/design-system.md`

## Riscos

- **Conclusão em dois caminhos:** sessão de leitura e roda de status podem
  disparar a resenha duas vezes; centralizar a abertura em um único ponto.
- **Resenha obrigatória:** bloquear a conclusão até resenhar irrita; o "Agora
  não" precisa ser explícito e testado.
- **Reabrir sem perder texto:** se a resenha ficar oculta, não apague a linha ao
  voltar para `reading`.
- **Migração aditiva:** `reviews` é tabela nova; não recriar `books`.
- **Órfãs:** sem FK, a exclusão explícita no repositório é a única garantia;
  testar com SQLite real e com o repositório em memória.
- **Testes de tela:** o fluxo de conclusão mexe em status/progresso; usar o
  repositório em memória coerente e nunca afirmar sobre frames de animação.

## Próximo depois desta

**S10** — estatísticas e insights.
