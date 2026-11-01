# Estado atual

## Sessão

- **Atual:** S10 (estatísticas e insights) implementada em 2026-11-01; falta
  conferir no Android para encerrar.
- **Última concluída:** S9 (resenha + campos extras).
- **Próxima:** S11 (configurações + backup JSON) — spec em
  `docs/sessions/S11-configuracoes-backup.md`.
- **Planejada:** S11a (design 3D da lombada e emoções), depois da S11 — spec em
  `docs/sessions/S11a-design-3d-emocoes.md`; não executar agora.

## Pronto (S10)

- "Meu ritmo": rota `/estatisticas` aberta pelo atalho discreto da Estante
  (ícone de três barras + rótulo), abaixo de "N livros · N à vista".
- Períodos 4 semanas (padrão), 12 semanas e ano (12 meses corridos), tudo no dia
  local; semanas terminam hoje. A janela anterior serve só para comparar.
- Cartão do LêBot com uma frase calculada e humor coerente; adesivo de sequência
  quando ≥ 2 dias. Páginas, dias ativos e sequência em um card; média por dia
  ativo numa legenda.
- Ritmo em prateleira de lombadas (sem gráfico de lib): semana/mês corrente em
  dourado, valor compacto e cada coluna acessível por extenso. Gêneros em barras
  na cor da prateleira, top 5 + Outros, com páginas e concluídos. Mini-lombadas
  clicáveis dos concluídos, com mês. Nota média, estrelas e distribuição 5→1.
- Sessão órfã conta páginas e não entra em gênero/nota. Conclusão datada pela
  última sessão; sem sessão (roda/edição), `books.updated_at` aproximado.
- Vazio: mascote, frase e CTA para a Hoje, sem números falsos.
- Agregação pura (`period.ts`, `aggregate.ts`, `insights.ts`), `useStats` e
  `readingSessions.listLatestPerBook`. Sem migração e sem biblioteca de gráfico
  (ADR 0020). 35 testes novos (426 em 56 arquivos); lint, typecheck, test,
  doctor e export verdes.

## Decisões abertas

- Conferir no Android: atalho na Estante, prateleira com 4 e 12 barras, adesivo
  rotacionado, mini-lombadas e estado vazio. Só então marcar S10 como `[x]`.
- S11: formato e versionamento do backup, restauração substitui × mescla, capas
  no backup (hoje só o caminho), lembrete (sem `expo-notifications`) e o que
  fazer com Aparência. Tudo em `docs/sessions/S11-configuracoes-backup.md`.
- S11a (planejada): decisões fechadas; não executar antes da S11.
- Galeria de citações no backlog (`reviews.quote` pronta).
- `finished_at` no backlog: a data aproximada de conclusão manual só melhora com
  coluna própria e backfill (ADR 0020).

## Arquivos-chave

- `src/features/stats/` (`StatsScreen`, `RhythmChart`, `GenreBars`,
  `RatingSummary`, `FinishedStrip`, `period.ts`, `aggregate.ts`, `insights.ts`,
  `use-stats.ts`, `charts.ts`)
- `src/app/estatisticas.tsx`, `src/app/(tabs)/index.tsx`
- `src/features/library/EstanteScreen.tsx` (atalho), `types.ts` (`updatedAt`)
- `src/db/repositories/reading-sessions.ts` (`listLatestPerBook`)
- `src/lib/day.ts` (dia local compartilhado com o motor do plano)
- `src/components/ui/StatsIcon.tsx`, `src/theme/sizes.ts` (`sizes.chart`)
- `src/test-utils/repositories.ts`, ADR 0020

## Armadilhas

- Estatística agrupa por **dia local**, nunca UTC. Use `src/lib/day.ts`.
- `appliedPages ?? pages`: sessões antigas não têm a coluna; contar `pages` cru
  infla o período quando a sessão passou do fim.
- Sequência usa uma janela de 366 dias; se a tela pedir mais que isso, a
  sequência trava no limite da janela.
- "Concluído em" = última sessão. Livro concluído antes do período mas com
  `updatedAt` recente não conta (a última sessão vence). Não troque a ordem.
- Nota média é de todas as resenhas, não do período; o cartão diz isso. Não
  filtre por `updatedAt` da resenha.
- Rota tipada: `.expo/types/router.d.ts` é gerado; rota nova exige
  `npx expo start --offline` antes do typecheck (o `expo export` não regenera).
- `renderWithProviders` injeta os repositórios; tela de stats precisa de
  `readingRepository` e `reviewsRepository` nos cenários customizados.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
