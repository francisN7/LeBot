# ADR 0013 — Motor do plano diário: contrato e regras anti-ressaca

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S6

## Contexto

A S6 precisava transformar meta, fila e histórico recente num plano diário
determinístico. A spec trazia porcentagens de anti-ressaca como **proposta**, e
o dono confirmou os valores na abertura da sessão. Restrições:

- o motor não pode depender de React Native, banco, relógio global, aleatório ou
  IA; a S7 só exibe o resultado;
- a fila real só chega na S8 — o motor não pode conhecer a fixture da Fila;
- plano persistido e edição manual são S7; a S6 não grava nada;
- a soma do plano não pode passar da meta nem do restante de cada livro;
- o dono quer uma sugestão de leitura paralela, sem pop-up cobrando a leitura.

## Decisão

### Função pura com data e fila por parâmetro

`buildPlan(input)` mora em `src/features/planner/engine/` e recebe `today`,
`goalPages`, `books`, `sessions` e `queueBookIds`. Devolve `Plan` com `date`,
`baseGoal`, `goal`, `pages`, `entries`, `lightDay` e `emptyReason`. Nenhuma
importação de `@/db`, `@/features` de UI ou `react-native`.

### Regras confirmadas pelo dono

- **Meta:** 3–200; `0`/negativo/`NaN` caem em 3. Meta `< 10` não divide o dia:
  um livro leva a meta (o segundo só entra se o primeiro acabar).
- **Ativo:** livro `reading` com sessão mais recente nos últimos 7 dias de
  calendário (hoje + 6). Empate pela ordem da fila. Sem ativo, a fila decide.
- **Volta leve:** última sessão de qualquer livro há **3 dias ou mais** → meta a
  70%. Sem histórico, meta normal.
- **Elegíveis:** `reading` e `queued` com páginas restantes. `paused` e
  `finished` nunca entram.
- **Teto de 60%:** só com livro ativo e meta do dia ≥ 10. É uma preferência: se
  não houver outro livro para receber a sobra, o último bloco (ou o ativo) pode
  passar de 60% até o restante dele.
- **Alternância:** próximo livro de gênero diferente quando houver; repete só na
  falta de opção.
- **Arredondamento:** fração > 0,7 sobe; 0,7 ou menos desce. Conta inteira para
  não depender de ponto flutuante.
- **Sugestão:** com ativo, os blocos seguintes são `suggestion: true` (leitura
  paralela opcional); sem ativo, o primeiro da fila é o plano.
- **Plano bruto:** não desconta a leitura de hoje; a UI (S7) compara com as
  sessões do dia.

### Erros e vazios

Sem livro elegível, `entries` fica vazio e `emptyReason` é `'no-books'`. Plano
que não fecha a meta porque os livros acabaram é parcial, não erro.

## Consequências

- A S7 consegue montar a tela Hoje só com dados que já existem: `useBooks`,
  `useGenres`, `useSettings` e as sessões recentes. A S8 troca a ordem passada
  em `queueBookIds`.
- Os testes de motor não abrem banco nem React Native; 75 casos cobrem dia,
  arredondamento, seleção e o plano completo.
- `docs/planner-algorithm.md` é a referência de produto; se uma regra mudar,
  muda lá, no motor e nos testes juntos.
- Persistência e edição manual do plano continuam para a S7.

## Alternativas descartadas

- **Teto de 60% rígido:** deixaria a meta em 10 de 18 quando só existe um livro.
- **Aplicar 60% sempre:** dividiria 3 páginas em dois blocos e contrariaria a
  decisão de meta pequena.
- **Planejar `paused`:** o dono pausou de propósito; a leitura paralela é
  sugestão de UI, não bloco do plano.
- **Usar datas em texto `YYYY-MM-DD`:** mais burocrático para a S7; `Date` com
  dia local resolve e os testes montam datas com componentes locais.
- **Plano líquido (descontar o lido hoje):** os blocos mudariam no meio do dia;
  o plano bruto é estável e a UI mostra o progresso.
- **Persistir o plano na S6:** o motor é determinístico; gravar agora criaria
  uma segunda fonte de verdade antes da S7 decidir edição manual.
