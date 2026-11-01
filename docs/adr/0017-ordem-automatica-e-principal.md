# ADR 0017 — Ordem automática por status e principal = primeiro Lendo

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S8 (revisão da ADR 0016)

## Contexto

A primeira versão da S8 tratava a Ordem como seleção manual: o dono adicionava
qualquer livro não concluído e o motor escolhia o "ativo" pela sessão mais
recente nos últimos 7 dias. Na conferência, o dono apontou dois problemas:

1. com Hobbit e Sapiens em `reading` e sem sessões, a Hoje mostrava só o Hobbit
   com a meta inteira, porque não havia "ativo" pelo critério de sessão;
2. a Ordem vazia pedia para adicionar livros, mas o status já diz o que está na
   frente — o dono quer **reordenar**, não selecionar.

A decisão vale para a S8 ainda aberta e substitui a parte da ADR 0016 que fala
em inclusão manual e em "ativo" pela sessão.

## Decisão

### Todo livro não concluído entra automaticamente

`sync` materializa em `queue_items` todos os livros `reading`, `queued` e
`paused`, e remove linhas de livro concluído ou excluído. A tela chama `sync`
quando a estante muda; `list` também deriva a ordem se alguma linha ainda não
existir. Não há botão de adicionar nem de remover: o status é a entrada e a
saída. Pausado aparece com o aviso de que fica fora do plano.

### Dois blocos, Lendo no topo

A ordem tem dois blocos contíguos:

1. **Lendo agora** — todos os `reading`, em ordem livre entre eles;
2. **Depois** — `queued` e `paused`, em ordem livre entre eles.

Arrastar/setas não cruzam os blocos. Um `queued`/`paused` não sobe para o topo;
para isso, o status precisa virar `reading` na Estante. Um `reading` também não
desce para o bloco de baixo.

### O primeiro Lendo é o principal

`selectActiveBook(books)` devolve o **primeiro `reading` elegível na ordem**, e
não mais o de sessão mais recente. O primeiro item da Ordem fica coroado
("Principal") e é o bloco `active` do plano; o teto de 60% volta a valer sempre
que existe um principal. Reordenar os Lendo troca o principal.

Sem nenhum `reading`, não há principal: o primeiro elegível leva o dia inteiro,
como antes. Sessões continuam decidindo apenas a **volta leve** (3 dias).

### Livro novo entra no fim do próprio bloco

Um livro que passa a `reading` entra no fim de "Lendo agora"; um novo
`queued`/`paused`, no fim de "Depois". A ordem manual dos outros é preservada.
`reading` → `queued` sai do topo e mantém sua posição relativa no bloco de baixo
(na prática, tende a ficar no começo de "Depois" se estava no topo).

### Sugestão por bloco

"Sugerir ordem" aplica `suggestOrder` separadamente nos dois blocos. O primeiro
Lendo nunca muda de posição pela sugestão, então o principal é preservado.

## Consequências

- Com Hobbit (fantasia) e Sapiens (não-ficção) em `reading`, a meta 18 vira
  **11 + 7**, com Hobbit como principal.
- A Ordem deixa de ficar vazia em uma estante com livros não concluídos.
- Alcançar a Estante para mudar status é o único caminho para entrar/sair do
  bloco de cima; a S8a (roda de status) acelera isso.
- A migração `0005` continua a mesma; a diferença é que `sync` preenche a tabela
  automaticamente.
- O motor não depende mais de sessão para escolher o principal; os testes de
  seleção e planejamento foram ajustados.

## Alternativas descartadas

- **Manter a seleção manual da ADR 0016:** exige adicionar livros que o status
  já indica e deixa a Ordem vazia sem motivo.
- **Incluir automaticamente sem separar blocos:** deixaria um `queued` no topo e
  o principal seria ambíguo.
- **Principal pela sessão mais recente:** no seed não há sessão, e reordenar não
  teria efeito sobre o principal.
- **Todo livro novo no topo:** tomaria a frente sem o dono pedir; o escolhido foi
  o fim do bloco.
- **Sugestão no bloco inteiro:** poderia trocar o principal sem intenção.
