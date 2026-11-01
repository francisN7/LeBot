# S10 — Estatísticas e insights

## Objetivo

Uma tela que responde "como está a minha leitura?" com dados reais do aparelho:
ritmo, constância, gêneros e notas. Sem IA e sem gráfico que dependa de
biblioteca nova no MVP.

## Decisões fechadas (ADR 0020)

1. **Onde a tela mora:** rota `/estatisticas`, aberta por um atalho discreto na
   **Estante** abaixo do título ("Meu ritmo", ícone de três barras). Não é 5ª
   aba nem card da Hoje; a Hoje segue focada no plano.
2. **Período (calendário civil, no dia local):** 1 semana são os últimos 7 dias;
   1 mês é o mês corrente do dia 1 até hoje (padrão); 3 meses são o mês atual + 2
   anteriores; 1 ano é o ano civil jan→dez, com meses futuros vazios. O total
   para em hoje e a janela anterior é o período civil equivalente.
3. **Números:** páginas e média por dia com leitura; dias ativos e sequência
   atual; livros concluídos (mini-lombadas clicáveis); gêneros com páginas **e**
   concluídos; nota média e distribuição de todas as resenhas, com a lista dos
   livros de cada nota ao tocar nela.
4. **Linha do tempo:** como os períodos são civis, o passado fora da janela fica
   no "Ver tudo" (`/linha-do-tempo`): totais desde a primeira leitura e grade
   jan→dez por ano, fora dos filtros.
5. **Gráficos:** prateleira de lombadas para o ritmo e barras horizontais para
   gêneros, tudo com `View`/NativeWind. Sem biblioteca de gráfico.
6. **Insights:** uma frase calculada por tela, escolhida por prioridade, com o
   humor do mascote; tom descritivo, sem cobrança.
7. **Livro excluído:** sessões órfãs somam páginas, mas não entram em gênero ou
   nota. Resenha de livro excluído é ignorada.
8. **Vazio:** mascote, frase curta e CTA para a Hoje; nenhum gráfico zerado.
9. **Concluído em:** última sessão do livro; sem sessão, `books.updated_at`
   como data aproximada. Sem migração.

## Tarefas

1. **Agregação pura:** `src/features/stats/aggregate.ts` recebe sessões, livros,
   gêneros, resenhas, último dia de cada livro e período; devolve números e
   séries. Sem React Native, banco ou relógio global. `period.ts` (janelas e
   barras) e `insights.ts` (frase e humor) ficam ao lado, também puros.
2. **Repositório:** `readingSessions.listBetween` e `books.list`; `reviews.list`
   já existia. `listLatestPerBook` foi adicionado para datar a conclusão.
3. **Hook:** `useStats(period, today)` junta os repositórios e recalcula ao
   mudar de período ou após registrar/desfazer leitura.
4. **Tela:** rota `/estatisticas`, cabeçalho, seletor de período, cartão do
   LêBot, três números, prateleira de ritmo, gêneros, concluídos, notas com
   drill-down e o cartão "Ver tudo".
5. **Entrada:** atalho "Meu ritmo" na Estante, abaixo do título.
6. **Linha do tempo:** rota `/linha-do-tempo` com totais gerais e a grade
   jan→dez por ano, lendo `readingSessions.listAll()`.
7. **Testes:** agregação (períodos, dias ativos, sequência, órfãs, gêneros,
   nota média, lista por nota, vazio, conclusão aproximada), linha do tempo,
   `useStats` reagindo a escrita, e tela (números, troca de período, vazio,
   notas, "Ver tudo", voltar, abrir concluído).
8. **Docs:** `architecture.md`, `data-model.md`, `design-system.md`,
   `testing.md`, `CURRENT.md`, `roadmap.md`, `CHANGELOG.md` e ADR 0020.

## Aceite

- [x] A tela mostra páginas, dias ativos, sequência, concluídos, gêneros e nota
      média com dados reais do SQLite.
- [x] Trocar o período recalcula tudo sem reiniciar o app.
- [x] Registrar leitura atualiza a estatística ao voltar para a tela.
- [x] Sessões órfãs contam nas páginas e não quebram gênero/nota.
- [x] Estado vazio claro, sem números falsos.
- [x] Notas abrem os livros de cada nota e voltam ao resumo.
- [x] Períodos civis (semana rotativa, mês atual, últimos 3 meses, ano civil).
- [x] "Ver tudo" mostra o histórico completo fora dos períodos.
- [x] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes.
- [x] Conferido no Android em 2026-11-01.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `src/db/schema.ts`,
`src/db/repositories/reading-sessions.ts`, `books.ts`, `reviews.ts`,
`src/features/today/use-daily-plan.ts`, `src/features/today/HojeScreen.tsx`,
`src/theme/`, `docs/design/design-system.md` e ADRs 0012, 0015 e 0019.

## Arquivos prováveis

- `src/features/stats/` (`aggregate.ts`, `use-stats.ts`, `StatsScreen.tsx`)
- `src/app/estatisticas.tsx` (ou dentro de `(tabs)/`)
- `src/features/today/HojeScreen.tsx` (entrada)
- `src/test-utils/repositories.ts` (dados de sessões para testes)
- `docs/architecture.md`, `docs/design/design-system.md`, `docs/testing.md`

## Riscos

- **Fuso e virada do dia:** usar o dia local, como a Hoje já faz; não agrupar
  por UTC.
- **"Concluído em" não existe:** `books` só tem `updated_at`; decidir se o
  histórico usa a data da última sessão que levou ao fim ou passa a guardar
  `finished_at` numa migração aditiva. Recomendo derivar da sessão no MVP.
- **Gráfico sem biblioteca:** barras com `View` exigem cuidado com escala e
  acessibilidade (cada barra com rótulo/valor).
- **Números que culpam:** insights são descritivos, nunca "você falhou".
- **Custo de recálculo:** poucos milhares de linhas; agregação em memória basta.

## Próximo depois desta

**S11** — configurações + backup JSON (incluindo `reviews` e `review_fields`).
