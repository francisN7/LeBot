# Estado atual

## Sessão

- **Atual:** nenhuma sessão aberta; S9 implementada em 2026-11-01, com a
  conferência no Android pendente.
- **Última concluída:** S9 (resenha + campos extras); falta o aceite manual no
  Android.
- **Próxima:** S11a (design 3D da lombada e emoções) — spec em
  `docs/sessions/S11a-design-3d-emocoes.md`. S10 (estatísticas) e S11
  (configurações + backup) ficam pendentes na fila.

## Pronto (S9)

- Livro concluído permite nota 1–5 (obrigatória), texto e citação; a resenha
  abre automaticamente quando a sessão de leitura chega ao fim e por CTA no
  detalhe quando a conclusão veio da roda/edição. Salvar é upsert.
- Campos extras globais em Ajustes → "Campos de resenha": criar, renomear,
  excluir e quatro sugestões. Viram chips abaixo do texto, em acordeão; campo
  vazio não grava e excluir o campo limpa o valor nas resenhas.
- Reabrir o livro esconde a resenha sem apagar; reconcluir abre preenchida. A
  Estante mostra `★★★★` só em concluído com resenha, num slot de altura fixa
  para não desalinhar a grade.
- Concluir pela sessão de leitura abre a resenha tanto no detalhe quanto na
  Hoje; concluir pela roda/edição deixa o CTA no detalhe.
- Baixar as páginas lidas de um livro concluído reabre o livro (`finished` →
  `reading`); mudar o status sem mexer nas páginas também persiste, e um livro
  em leitura no fim não é chamado de "concluído" pelo card (adendo S9 da
  ADR 0018).
- Tabelas `reviews` (nota com `CHECK`, `quote` em coluna para a futura galeria,
  extras JSON) e `review_fields`; migração aditiva `0006`. Excluir o livro apaga
  a resenha na mesma transação (ADR 0019).
- 41 testes novos (391 em 49 arquivos); lint, typecheck, test, doctor e export
  verdes. Conferência no Android pendente.

## Decisões abertas

- Conferir no Android: abertura ao concluir (detalhe e Hoje), teclado
  multilinha, acordeão dos chips, cadastro em Ajustes, selo e alinhamento da
  grade.
- S11a: decisões fechadas (SVG com faces, lateral fina + tassel, páginas com
  texto na capa, sombra na grade e no detalhe, piscada em feliz/neutro). Falta
  confirmar se "grossa" é a profundidade (recomendado) ou a largura total.
- Galeria de citações no backlog (`reviews.quote` já pronta).
- S7.2 (opcional): persistir o plano + edição manual.
- Livro excluído deixa `reading_sessions` órfãs; a resenha sai junto. Limpeza no
  backlog (S11/S13).

## Arquivos-chave

- `src/db/repositories/reviews.ts`, `review-fields.ts`, `books.ts`
- `src/db/schema.ts`, `drizzle/0006_lame_warbound.sql`
- `src/features/reviews/` (`ReviewFormScreen`, `ReviewCard`, `use-reviews`)
- `src/components/ui/RatingStars.tsx`, `TextField.tsx`, `Chip.tsx`
- `src/features/library/BookDetailScreen.tsx`, `EstanteScreen.tsx`
- `src/features/settings/ReviewFieldsCard.tsx`
- `src/test-utils/repositories.ts`, `render.tsx`, ADR 0019

## Armadilhas

- `extras` é JSON por `field_id`: não invente campo fixo para "trecho" — citação
  é `reviews.quote` e a galeria futura depende disso.
- Só `onSettle` da roda grava status; a resenha nunca abre por cima do gesto.
- A abertura automática usa `write.book.status` da sessão de leitura; não abra
  por `pagesRead` na tela (o repositório é a fonte).
- Reabrir o livro não apaga a resenha; a UI esconde por status. Não filtre por
  status no repositório.
- Excluir campo limpa a chave em todas as resenhas; excluir livro apaga a
  resenha. Os dois caminhos têm teste no SQLite e no fake.
- Campo vazio (ou só espaços) não vira chave em `extras`.
- `TextField multiline` precisa de altura mínima; sem ela o campo nasce com uma
  linha no Android.
- Rota tipada: `.expo/types/router.d.ts` é gerado; rota nova exige
  `npx expo start --offline` antes do typecheck.
- `renderWithProviders` agora injeta `reviewsRepository` e
  `reviewFieldsRepository`; sem eles os hooks caem no banco real.
- `drizzle/*.sql` e `migrations.js` são gerados; rode `lint:fix` depois.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
