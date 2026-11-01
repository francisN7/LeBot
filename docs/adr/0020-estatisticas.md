# ADR 0020 — Estatísticas sem biblioteca de gráfico e data de conclusão derivada

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S10

## Contexto

A S10 responde "como está a minha leitura?" com dados reais do aparelho. A spec
deixou sete decisões para a abertura. O dono escolheu que a tela mora na
**Estante** (ícone discreto abaixo do título), não na Hoje nem numa 5ª aba, e
pediu um "dash fofo" abaixo da frase do LêBot.

Duas restrições guiaram o desenho: nada de biblioteca de gráfico no MVP
(`victory-native`/`react-native-svg` novo) e nenhuma migração só para datar uma
conclusão, porque `books` só tem `updated_at`.

## Decisão

1. **Rota própria `/estatisticas`**, aberta pelo atalho "Meu ritmo" na Estante
   (ícone desenhado em SVG + rótulo em `navyMuted`). A tela é `StatsScreen` com
   `onBack`, como `/generos`. A Hoje continua focada no plano do dia.
2. **Três períodos:** 4 semanas (padrão), 12 semanas e ano. As semanas terminam
   hoje (a última é a semana corrente, incompleta); o ano são 12 meses corridos
   acabando no mês atual. Tudo no **dia local**, via `src/lib/day.ts`. A janela
   anterior do mesmo tamanho serve só para comparar ritmo.
3. **Agregação pura em memória:** `src/features/stats/aggregate.ts` recebe
   sessões, livros, gêneros, resenhas, último dia de cada livro e o período;
   devolve números, séries e a frase. Sem React Native, banco ou relógio global.
   `useStats(period, today)` junta os repositórios e recalcula ao trocar o
   período e ao registrar/desfazer sessão. Um agregado de milhares de linhas é
   barato; não há consulta nova além de `listLatestPerBook`.
4. **Data de conclusão derivada:** a última sessão do livro é a data (a sessão
   que chega ao fim é, por definição, a última). Livro concluído pela roda ou
   pela edição, sem sessão, usa `books.updated_at` e é marcado como aproximado.
   Não entra em `books.updated_at` de livro cuja última sessão é anterior ao
   período, o que evitaria contar livro concluído há meses por causa de uma
   edição recente. Sem `finished_at` no MVP.
5. **Nenhuma biblioteca de gráfico:** barras e números com `View`/NativeWind.
   O ritmo é uma prateleira de lombadas (altura proporcional às páginas, base
   navy) e cada coluna é um elemento acessível com o total por extenso. Os
   tamanhos vivem em `sizes.chart`. Gêneros viram barras horizontais na cor do
   gênero.
6. **Páginas × concluídos:** gêneros mostram as duas medidas — páginas do
   período (esforço atual) e livros concluídos (contagem). Sessão órfã soma
   páginas no total, mas não entra em gênero; resenha de livro excluído não
   entra em nota.
7. **Insight é uma frase calculada**, escolhida por prioridade (sequência,
   conclusões, gênero dominante, alta sobre o período anterior, nota média, dias
   ativos, silêncio recente), com humor do mascote coerente. Tom descritivo:
   nada de "você falhou". A nota média é de todas as resenhas e o cartão diz
   isso.
8. **Vazio sem números falsos:** sem sessões nem conclusões no período, a tela
   troca o dash por mascote, frase e CTA para a Hoje — nenhum gráfico zerado.

## Consequências

- A tela não tem tabela nem migração: tudo é derivado de `reading_sessions`,
  `books`, `reviews` e `genres`.
- `reading_sessions.listLatestPerBook()` (uma linha por livro) foi adicionado ao
  repositório real e ao fake; continua valendo a regra de que só o repositório
  fala SQL.
- `Book` ganhou `updatedAt` na UI, porque o agregado precisa da data aproximada
  de conclusão. É o único timestamp exposto ao app.
- A frase pode ficar "genérica" em períodos com pouca leitura; a prioridade
  garante que ela nunca invente número.
- O gráfico não anima e não depende de lib; a prateleira é o mesmo vocabulário
  visual das lombadas.
- O ano recalcula 12 meses e a janela anterior de 12 meses: no máximo quatro
  consultas por abertura, todas indexadas por `read_at` (a listagem é filtrada
  em memória pelo agregado).

## Alternativas descartadas

- **5ª aba ou card na Hoje:** cinco abas espremidas e um dash competindo com o
  plano do dia; o dono escolheu a Estante.
- **Migração `finished_at`:** precisa de backfill, não cobre o histórico já
  gravado e só melhora o caso de conclusão manual.
- **`victory-native`/`react-native-svg` para gráfico:** peso e dependência nova
  para quatro séries simples; o app já desenha arte vetorial própria.
- **Concluídos por mês em barras:** menos informativo que as mini-lombadas
  clicáveis e não leva ao livro.
- **Filtrar notas pelo período:** a resenha é atemporal; filtrar por
  `reviews.updated_at` esconderia o histórico e a tela diria "sem resenhas" com
  resenhas salvas.

## Adendo — revisão no Android (2026-11-01)

O dono conferiu a tela no aparelho e pediu quatro ajustes, fechados assim:

1. **Períodos finais:** 1 semana (7 dias, uma barra por **dia**), 1 mês (4
   semanas), 3 meses (12 semanas) e 1 ano (12 meses). O seletor usa o rótulo
   curto; o subtítulo da tela diz a janela exata ("Últimas 4 semanas").
2. **Rótulos do ritmo sem corte:** as colunas dividem a largura disponível e,
   com 12 barras, a semana mostra só o dia do mês (`10`) e o mês continua `jan`.
   O valor acima da barra é compacto (`1k`) e o leitor de tela ouve o total.
3. **Média explícita:** "Média de N páginas por dia com leitura, em M dias do
   período." A média continua sendo por dia **ativo**, não por dia corrido.
4. **Notas clicáveis:** tocar numa nota troca o conteúdo do cartão pelos títulos
   daquela nota (autor e estrelas), com "Voltar às notas" acima e o livro
   abrindo no detalhe.

## Adendo 2 — períodos civis e linha do tempo (2026-11-01)

Ao conferir os filtros, o dono apontou que as janelas rotativas deixavam o
passado de fora e desalinhavam mês e ano (dezembro de 2025 virava a primeira
barra do "ano"). As regras finais:

1. **1 semana:** últimos 7 dias, uma barra por dia.
2. **1 mês:** mês civil do dia 1 até hoje, blocos de 7 dias a partir do dia 1
   (1–7, 8–14…); a janela anterior é o mês anterior inteiro.
3. **3 meses:** mês atual + os dois anteriores, uma barra por mês; a janela
   anterior são os três meses anteriores.
4. **1 ano:** ano civil jan→dez, uma barra por mês; meses futuros ficam vazios.
   A janela anterior é o ano anterior inteiro.
5. O total sempre para em hoje; barras futuras existem só para manter a grade do
   calendário estável.
6. **"Ver tudo" abre `/linha-do-tempo`**, fora dos filtros: primeira leitura,
   totais gerais (páginas, dias com leitura, concluídos) e uma grade jan→dez por
   ano. É o "passado perdido" que as janelas civis deixariam de fora.
7. A linha do tempo lê `readingSessions.listAll()` à parte; `useStats` continua
   carregando só a janela do período mais a sequência.


