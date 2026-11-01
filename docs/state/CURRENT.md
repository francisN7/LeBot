# Estado atual

## Sessão

- **Atual:** S10 (estatísticas e insights) implementada em 2026-11-01 e
  revisada com o retorno do Android; falta a reconferência final para encerrar.
- **Última concluída:** S9 (resenha + campos extras).
- **Próxima:** S11 (configurações + backup JSON) — spec em
  `docs/sessions/S11-configuracoes-backup.md`.
- **Planejada:** S11a (design 3D da lombada e emoções), depois da S11 — spec em
  `docs/sessions/S11a-design-3d-emocoes.md`; não executar agora.

## Pronto (S10)

- "Meu ritmo": rota `/estatisticas` aberta pelo atalho discreto da Estante
  (ícone de três barras + rótulo), abaixo de "N livros · N à vista".
- Períodos civis: 1 semana (últimos 7 dias, uma barra por dia), 1 mês (mês
  corrente do dia 1 até hoje, blocos de 7 dias, padrão), 3 meses (mês atual + 2
  anteriores, uma barra por mês) e 1 ano (ano civil jan→dez, meses futuros
  vazios). Janela anterior equivalente; total sempre para em hoje.
- Cartão do LêBot com uma frase calculada e humor coerente; adesivo de sequência
  quando ≥ 2 dias. Páginas, dias com leitura e sequência em um card; abaixo,
  "Média de N páginas por dia com leitura, em M dias do período.".
- Ritmo em prateleira de lombadas (sem gráfico de lib): uma barra por
  dia/bloco/mês conforme o período, coluna corrente em dourado, largura
  dividida entre as colunas e rótulos curtos para não cortar. Gêneros em barras
  na cor da prateleira, top 5 + Outros, com páginas e concluídos. Mini-lombadas
  clicáveis dos concluídos, com mês. Nota média, estrelas e distribuição 5→1;
  tocar numa nota abre os livros daquela nota, com "Voltar às notas".
- "Ver tudo" abre `/linha-do-tempo`: totais desde a primeira leitura (páginas,
  dias com leitura, concluídos) e uma grade jan→dez por ano, fora dos filtros.
- Sessão órfã conta páginas e não entra em gênero/nota. Conclusão datada pela
  última sessão; sem sessão (roda/edição), `books.updated_at` aproximado.
- Vazio: mascote, frase e CTA para a Hoje, sem números falsos.
- Agregação pura (`period.ts`, `aggregate.ts`, `insights.ts`, `timeline.ts`),
  `useStats`, `useTimeline` e `readingSessions.listAll`/`listLatestPerBook`. Sem
  migração e sem biblioteca de gráfico (ADR 0020, com dois adendos). 46 testes
  novos (437 em 58 arquivos); lint, typecheck, test, doctor e export verdes.

## Decisões abertas

- Reconferir no Android: períodos civis (mês e ano), rótulos sem corte, o
  subtítulo por unidade, a frase de média, o drill-down das notas, o "Ver tudo"
  com a linha do tempo e o vazio. Só então marcar S10 como `[x]`.
- S11: formato e versionamento do backup, restauração substitui × mescla, capas
  no backup (hoje só o caminho), lembrete (sem `expo-notifications`) e o que
  fazer com Aparência. Tudo em `docs/sessions/S11-configuracoes-backup.md`.
- S11a (planejada): decisões fechadas; não executar antes da S11.
- Galeria de citações no backlog (`reviews.quote` pronta).
- `finished_at` no backlog: a data aproximada de conclusão manual só melhora com
  coluna própria e backfill (ADR 0020).

## Arquivos-chave

- `src/features/stats/` (`StatsScreen`, `TimelineScreen`, `RhythmChart`,
  `GenreBars`, `RatingSummary`, `FinishedStrip`, `StatNumber`, `period.ts`,
  `aggregate.ts`, `insights.ts`, `timeline.ts`, `use-stats.ts`,
  `use-timeline.ts`, `charts.ts`)
- `src/app/estatisticas.tsx`, `src/app/linha-do-tempo.tsx`,
  `src/app/(tabs)/index.tsx`
- `src/features/library/EstanteScreen.tsx` (atalho), `types.ts` (`updatedAt`)
- `src/db/repositories/reading-sessions.ts` (`listAll`,
  `listLatestPerBook`)
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
- Períodos são **civis**: semana rotativa, mês corrente, mês atual + 2 anteriores
  e ano jan→dez. Não volte a janelas de 4/12 semanas nem a 12 meses corridos; o
  total para em hoje e meses futuros existem só para manter a grade.
- A linha do tempo usa `listAll` em `useTimeline`; não a acople ao `useStats`,
  que carrega só a janela do período + sequência.
- Rótulo de barra não cabe em largura fixa: as colunas dividem a largura; com 12
  meses o rótulo é `jan` e o valor vira `1k`. Não volte a
  `sizes.chart.barWidthCompact` como largura da coluna.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
