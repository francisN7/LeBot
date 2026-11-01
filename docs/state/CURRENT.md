# Estado atual

## Sessão

- **Atual:** nenhuma; S10 concluída em 2026-11-01 e conferida no Android.
- **Última concluída:** S10 (estatísticas e linha do tempo).
- **Próxima:** S11 (configurações + backup JSON), spec em
  `docs/sessions/S11-configuracoes-backup.md`; depois S11a (design 3D), que não
  deve ser antecipada.

## Pronto (S10)

- "Meu ritmo" em `/estatisticas`, aberta pelo atalho discreto da Estante
  (ícone de três barras + rótulo), abaixo de "N livros · N à vista".
- Períodos civis no dia local: 1 semana (últimos 7 dias, barra por dia), 1 mês
  (mês corrente do dia 1 até hoje, blocos de 7 dias, padrão), 3 meses (mês atual
  + 2 anteriores, barra por mês) e 1 ano (ano civil jan→dez, futuro vazio). A
  janela anterior é o período equivalente; o total sempre para em hoje.
- Cartão do LêBot com uma frase calculada e humor coerente; adesivo de sequência
  quando ≥ 2 dias. Páginas, dias com leitura e sequência; média por dia com
  leitura explícita ("Média de N páginas por dia com leitura, em M dias do
  período.").
- Ritmo em prateleira de lombadas, sem lib de gráfico: coluna corrente em
  dourado, colunas dividindo a largura e rótulos curtos. Gêneros em barras na
  cor da prateleira, top 5 + Outros. Mini-lombadas clicáveis dos concluídos.
  Nota média e distribuição 5→1; tocar numa nota abre os livros daquela nota,
  com "Voltar às notas".
- "Ver tudo" abre `/linha-do-tempo`: totais desde a primeira leitura e grade
  jan→dez por ano, fora dos filtros (o passado que os períodos civis deixam de
  fora).
- Sessão órfã conta páginas e não entra em gênero/nota. Conclusão datada pela
  última sessão; sem sessão (roda/edição), `books.updated_at` aproximado.
  Período vazio mostra mascote e CTA, sem gráfico zerado.
- Agregação pura (`period`, `aggregate`, `insights`, `timeline`), `useStats`,
  `useTimeline` e `readingSessions.listAll`/`listLatestPerBook`. Sem migração
  (ADR 0020, com dois adendos). 46 testes novos (437 em 58 arquivos); lint,
  typecheck, test, doctor e export verdes no commit `dd6501f`.

## Decisões abertas

- S11: formato/versão do backup, restaurar substitui × mescla, capas (hoje só o
  caminho), lembrete sem `expo-notifications` e o que fazer com Aparência.
- S11a: decisões fechadas; não executar antes da S11.
- Backlog: galeria de citações, `finished_at`, grid ajustável na Estante,
  refinamento das animações do mascote e mais temas além de claro/escuro.

## Arquivos-chave

- `src/features/stats/` (`StatsScreen`, `TimelineScreen`, `period`, `aggregate`,
  `insights`, `timeline`, `use-stats`, `use-timeline`, `charts`)
- `src/app/estatisticas.tsx`, `src/app/linha-do-tempo.tsx`
- `src/features/library/EstanteScreen.tsx`, `types.ts` (`updatedAt`)
- `src/db/repositories/reading-sessions.ts`
- `src/lib/day.ts`, `src/components/ui/StatsIcon.tsx`, `src/theme/sizes.ts`
- `src/test-utils/repositories.ts`, ADR 0020

## Armadilhas

- Estatística agrupa por **dia local**, nunca UTC (`src/lib/day.ts`).
- `appliedPages ?? pages`: sessões antigas não têm a coluna; `pages` cru infla o
  período quando a sessão passou do fim.
- Sequência usa uma janela de 366 dias; acima disso ela trava no limite.
- "Concluído em" = última sessão. Livro concluído antes do período com
  `updatedAt` recente não conta (a última sessão vence).
- Nota média é de todas as resenhas, não do período; não filtre por
  `reviews.updated_at`.
- Períodos são civis: não volte a janelas de 4/12 semanas nem a 12 meses
  corridos; o total para em hoje e meses futuros só completam a grade.
- Linha do tempo usa `listAll` em `useTimeline`; não a acople ao `useStats`.
- Rota tipada: rota nova exige `npx expo start --offline` antes do typecheck.
- `renderWithProviders`: stats precisa de `readingRepository` e
  `reviewsRepository` nos cenários customizados.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
