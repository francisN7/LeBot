# S10 — Estatísticas e insights

## Objetivo

Uma tela que responde "como está a minha leitura?" com dados reais do aparelho:
ritmo, constância, gêneros e notas. Sem IA e sem gráfico que dependa de
biblioteca nova no MVP.

## Decisões a confirmar na abertura

1. **Onde a tela mora.** Opções: nova aba (5ª), card na Hoje ou entrada em
   Ajustes. Recomendo **rota `/estatisticas` aberta pela Hoje**, para não
   espremer cinco abas e manter o foco da Hoje no plano do dia.
2. **Período.** Recomendo um seletor simples de **4 semanas / 12 semanas / ano**,
   com padrão em 4 semanas. Tudo derivado de `reading_sessions.read_at`.
3. **Quais números entram.** Recomendo:
   - páginas lidas no período e média por dia ativo;
   - dias ativos e sequência atual (streak) de dias com leitura;
   - livros concluídos no período, com mini-histórico por mês;
   - distribuição por gênero (páginas ou livros concluídos?);
   - nota média dos livros com resenha (`reviews.rating`).
4. **Gráficos.** Recomendo barras e números com `View`/NativeWind, no visual do
   app, sem `victory-native`/`react-native-svg` no MVP. Um gráfico de barras por
   semana cobre o ritmo; gêneros viram barras horizontais com a cor do gênero.
5. **"Insights" é texto calculado, não IA.** Ex.: "Você leu em 5 dos últimos 7
   dias", "Fantasia puxa 62% das páginas do mês", "Sua nota média é 4,2".
   Regras puras e testadas; sem tom de cobrança.
6. **Livro excluído.** Sessões órfãs continuam somando páginas no período (já é
   a regra da Hoje), mas não entram em gênero/nota. Confirmar.
7. **Vazio.** Sem sessões no período, mostrar mascote e uma frase curta, sem
   gráfico zerado.

## Tarefas

1. **Agregação pura:** `src/features/stats/aggregate.ts` recebe sessões, livros,
   gêneros, resenhas, período e "hoje"; devolve números e séries. Sem React
   Native, banco ou relógio global.
2. **Repositório:** usar `readingSessions.listBetween` e `books.list`; adicionar
   `reviews.list` já existe. Se faltar consulta por período de conclusão, derivar
   de `books.updatedAt`/resenha — confirmar a fonte de "concluído em".
3. **Hook:** `useStats(period)` junta os repositórios e recalcula ao mudar
   período ou após registrar leitura (assinatura de `reading_sessions` + livros).
4. **Tela:** rota `/estatisticas`, cabeçalho, seletor de período, cartões de
   números, barras por semana, gêneros e notas, estado vazio.
5. **Entrada:** link/card na Hoje (ou aba, conforme decisão 1).
6. **Testes:** agregação (períodos, dias ativos, streak, órfãs, gêneros, nota
   média, vazio) e tela (números, troca de período, estado vazio).
7. **Docs:** `architecture.md`, `data-model.md` (se surgir consulta nova),
   `design-system.md` (barras), `testing.md`, `CURRENT.md`, `roadmap.md` e
   `CHANGELOG.md`; ADR para a decisão de tela/período e para "sem biblioteca de
   gráfico".

## Aceite

- [ ] A tela mostra páginas, dias ativos, sequência, concluídos, gêneros e nota
      média com dados reais do SQLite.
- [ ] Trocar o período recalcula tudo sem reiniciar o app.
- [ ] Registrar leitura atualiza a estatística ao voltar para a tela.
- [ ] Sessões órfãs contam nas páginas e não quebram gênero/nota.
- [ ] Estado vazio claro, sem números falsos.
- [ ] `lint`, `typecheck`, `test`, `doctor` e `expo export` verdes; conferido no
      Android.

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
