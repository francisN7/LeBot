# ADR 0016 — Ordem persistida em `queue_items`

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S8

## Contexto

A S7.1 deixou a Ordem somente leitura e ainda alimentada por uma fixture. A S8
precisava decidir onde a sequência mora, o que entra nela, como reordenar e como
aplicar a sugestão anti-ressaca. O motor já recebe `queueBookIds` e ignora ids
desconhecidos, repetidos ou de livro concluído (ADR 0013).

Restrições: migração aditiva, sem FK física (padrão do projeto), arrastar sem
perder a rolagem e uma alternativa acessível por leitor de tela.

## Decisão

### Tabela própria, não coluna em `books`

`queue_items` guarda `book_id` (PK), `position`, `note` opcional e timestamps.
A posição é sempre compacta, de `0..n-1`, e `move`/`replaceAll` reescrevem a
lista inteira numa transação. A leitura ignora linhas de livro excluído ou
`finished`; a próxima escrita limpa essas linhas.

Uma coluna `queue_position` em `books` misturaria ordem com o livro e deixaria a
reordenação sujeita a empate ou buraco entre duas escritas.

### Qualquer livro não concluído entra

`reading`, `queued` e `paused` podem estar na Ordem. O status não muda ao
adicionar: pausar é decisão do dono e continua valendo. A UI avisa que um livro
pausado fica fora do plano, mas ele permanece na sequência.

### Arrastar com setas como alternativa

A alça usa `react-native-gesture-handler` + Reanimated. O gesto entrega só o
deslocamento; a tela soma as alturas medidas das linhas e chama `move`. As setas
↑/↓ têm o mesmo efeito e são o caminho acessível. O `Screen` passou a usar o
`ScrollView` do gesture handler para o arrastar não brigar com a rolagem.

### Sugestão aplicada direto

`suggestOrder` mantém o primeiro livro (a intenção do dono) e, a cada passo,
pega o primeiro restante de gênero diferente do anterior; sem opção, repete o
gênero. É determinística, idempotente e não perde nem duplica livro. O botão
aplica na hora e fica desabilitado quando a sugestão já é a ordem atual.

### A Ordem não registra leitura

Adicionar, remover e reordenar não abrem modal de páginas nem mudam status.
Registrar leitura continua sendo papel da Hoje (ADR 0015). O toque no item abre
o detalhe.

## Consequências

- A Hoje passa a ler a sequência real por `useQueueBookIds`; reordenar notifica
  o hook e a próxima abertura do plano usa a ordem nova.
- `queue_items` nasce vazia na migração `0005`: a ordem que existia na fixture
  não é copiada para o aparelho.
- Excluir um livro ou concluí-lo não exige escrever na Ordem: a leitura ignora a
  linha e a próxima escrita compacta. A limpeza definitiva pode entrar na S9/S11.
- O arrastar depende de `GestureHandlerRootView` no `_layout` e de um mock de
  `react-native-worklets` no Jest.

## Alternativas descartadas

- **Coluna em `books`:** menos uma tabela, mas reordenar em transação única fica
  sujeito a colisão de posição e mistura intenção com dado do livro.
- **Só livros `queued`:** impediria o dono de reservar um livro em leitura ou
  pausado para depois do atual.
- **Adicionar pausado volta para `queued`:** adicionar à Ordem não é sinal de
  retomada; o status só muda na Hoje ou na roda da S8a.
- **Prévia antes de aplicar a sugestão:** mais um diálogo para uma ação
  reversível pelas setas/arrastar.
- **Só setas:** cumpriria a acessibilidade, mas o dono pediu arrastar como
  caminho principal.
- **Guardar a ordem em `settings` como JSON:** sem schema, sem transação e sem
  tipo no banco.

## Adendo (2026-11-01, S8 — revisão)

Na conferência da S8, o dono redefiniu o modelo: a Ordem passa a incluir
automaticamente todo livro não concluído (status manda), sem adicionar/remover, e
o principal é o **primeiro Lendo da ordem**, não mais o de sessão mais recente.
A tabela, a transação e a migração `0005` continuam válidas; a inclusão manual e
a escolha do ativo foram substituídas pela ADR 0017.
