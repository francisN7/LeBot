# ADR 0027 — Estante carrega os livros em memória (e o plano dos blocos)

- **Status:** aceito
- **Data:** 2026-11-03
- **Sessão:** S12b
- **Relacionada:** complementa a ADR 0024 (grade virtualizada); conversa com a
  ADR 0007 (SQLite/Drizzle)

## Contexto

A medição da estante cheia precisa separar duas causas diferentes de queda de
fps:

1. **Animação** — quatro loops por lombada montada (brilho, piscada, “zzz” e
   tassel).
2. **Dados** — ler o SQLite, montar as linhas e alimentar a lista.

Sem essa separação, um ganho de animação pode ser confundido com ganho de
carregamento (e o tratamento seria outro).

O que o código faz hoje (`src/features/library/use-books.tsx`):

- `useState(() => repository.list())` chama o SQLite **de forma síncrona no
  mount** e guarda **todas** as linhas em memória;
- `books` é `rows.map(toBook)` memoizado; busca, filtros, contagem e a Ordem
  usam essa lista inteira;
- durante a rolagem **não há I/O** — só render. O custo de dados se concentra na
  abertura do app e em qualquer escrita (criar/editar/registrar leitura), que
  dispara um `list()` novo.

Com 200 livros isso é irrelevante: o `list()` síncrono é da ordem de poucos
milissegundos e a lista vira 200 objetos. O gargalo medido na estante cheia é de
frame, não de carregamento.

## Decisão

### 1. Manter a base em memória no MVP

Não paginar o repositório agora. A lista inteira em memória é o que permite
busca sem acento, filtros por gênero/status, contagem, sugestão de ordem e
backup funcionarem sem ida ao banco a cada tecla. O limite prático aceito é a
ordem de **centenas a poucos milhares** de livros — mais do que qualquer leitor
humano tem, e dentro do que o SQLite + JS aguentam sem cuidado especial.

### 2. Tratar o carregamento como medição separada

Nas sessões de performance, a abertura do app é medida à parte da rolagem:
tempo até a primeira tela (`am start -W` e a linha `Displayed` do logcat) e
frames dos primeiros segundos. A rolagem mede só animação/render, porque o
caminho de dados é idêntico entre as versões comparadas.

### 3. Plano B: blocos de 200 com o mascote esperando

Se uma base real passar do que a memória comporta bem, a evolução é:

- `repository.listPage(offset, limit)` com blocos de **200** livros;
- a estante recebe o primeiro bloco e pede o próximo ao se aproximar do fim da
  lista (`onEndReached`), mantendo o que já veio;
- a busca continua correta: ou consulta o SQL (com normalização de acento) em
  vez de filtrar em memória, ou carrega os blocos restantes antes de filtrar —
  decisão a tomar com a medição na mão;
- enquanto um bloco carrega, entra um **indicador do LêBot** (“espera aí”)
  animado, no lugar de uma tela vazia ou de um spinner genérico;
- backup, ordem e resenhas leem do banco como hoje (já são consultas próprias).

Isso é trabalho de sessão própria, com spec e medição — não entra escondido numa
otimização de animação.

## Consequências

- A comparação 0.2.0 → 0.2.1 isola animação por construção: os dois builds têm o
  mesmo caminho de dados, então a diferença de janky é o custo dos loops.
- A estante continua simples de raciocinar: uma fonte da verdade em memória, sem
  estado de paginação, cache parcial ou invalidação entre blocos.
- O custo de memória cresce linear com o acervo (~alguns KB por livro com capa
  como URI, não como bitmap). Para acervos gigantes, o caminho está definido
  acima em vez de improvisado.
- Qualquer tela que hoje renderize a lista inteira **sem virtualização** (a
  Ordem é o caso conhecido) tem o mesmo tipo de limite e precisa da própria
  medição antes de decidir entre virtualizar e paginar.

## Alternativas descartadas

- **Paginar já:** muda busca, filtros, contagem, ordem e backup; o ganho com
  centenas de livros é nulo.
- **Ler o SQLite em thread separada e mostrar a lista vazia:** troca alguns ms
  de espera por um estado vazio que pisca; pior percepção.
- **Cache em disco do JSON da estante:** mais uma camada para invalidar em toda
  escrita, sem ganho medido.
