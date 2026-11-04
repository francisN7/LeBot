# Motor do plano diário

**O que responde:** quais livros ler hoje e quantas páginas em cada um.
**O que não responde:** como o plano aparece na tela
([`architecture.md`](architecture.md#plano-e-hoje)) nem o porquê da decisão
([ADR 0013](../adr/0013-motor-do-plano.md)).

É uma função pura (`buildPlan`) em `src/features/planner/engine/`: não importa
React Native, banco, rede ou IA, não lê o relógio global e não usa aleatoriedade.
A ordem vem de `queue_items`.

## Entrada

| Campo | O que é |
|---|---|
| `today` | dia de referência (`Date`); o motor usa o **dia local** do aparelho |
| `goalPages` | meta de `settings.goal.pages`; limitada a 3–200 |
| `books` | id, gênero, status, total de páginas e páginas lidas |
| `sessions` | histórico com a última sessão de cada livro e a última geral |
| `queueBookIds` | ordem da fila; sem ela, vale a ordem de `books` |

O motor não valida Zod: o chamador entrega dados tipados. Meta inválida é
tratada (regra 1) e livro inexistente na fila é ignorado.

## Saída

`Plan` tem o dia (`YYYY-MM-DD`), a meta pedida (`baseGoal`), a meta do dia
(`goal`), o total (`pages`), os blocos (`entries`), a marca de volta leve
(`lightDay`) e o motivo de plano vazio (`emptyReason: 'no-books'`).

Cada bloco traz `bookId`, `pages`, `source` (`active`/`queue`), `finishes` (o
plano cobre o restante) e `suggestion` (leitura paralela opcional).

## Regras

### 1. Meta entre 3 e 200

`goalPages` é truncada e limitada a **3–200**: inválida cai em 3 e acima de 200
vira 200. Com meta menor que 10 o motor **não divide o dia**: o primeiro livro
leva a meta inteira (o segundo só entra se o primeiro acabar).

### 2. O dia é local e entra por parâmetro

O motor nunca chama `new Date()` nem `Date.now()`. `today` e `readAt` são
instantes; a conta usa ano/mês/dia **locais**, nunca UTC. Uma sessão às 23:59
pertence àquele dia; duas no mesmo dia contam como um dia só. Trocar de fuso pode
mover um instante limítrofe — é o esperado.

### 3. Livros elegíveis

Entram `reading` e `queued` com páginas restantes (`pages - pagesRead > 0`).
**`paused` e `finished` nunca entram**: pausar é uma decisão do dono.

### 4. Principal: o primeiro Lendo da Ordem

O principal é o **primeiro livro `reading` na ordem recebida**. A Ordem coloca
todos os Lendo no topo; reordenar troca o principal. O histórico de sessões
**não** escolhe o principal. Sem nenhum `reading`, não há principal.

### 5. Volta leve: meta a 70% depois de 3 dias

Se a **última sessão de qualquer livro** foi há **3 dias ou mais**, a meta cai
para 70% (mínimo de 1 página). Sem nenhuma sessão no histórico não é volta leve:
usuário novo recebe a meta normal. **O chamador precisa passar a última sessão
mesmo que seja muito antiga**; um recorte de 7 dias esconderia uma volta de 30.

### 6. Ordem: principal, fila, resto

1. o principal (primeiro `reading`), quando existe;
2. os ids de `queueBookIds`, na ordem recebida;
3. os demais elegíveis, na ordem de `books`.

Ids desconhecidos, repetidos ou de livro concluído são ignorados. Livro fora da
fila ainda pode entrar como alternativa.

### 7. Teto de 60%: preferência, não parede

Com principal e meta **≥ 10**, cada livro recebe no máximo 60% da meta. Se a soma
dos outros não fechar a meta, o último bloco (ou o principal) pode passar dos 60%
até o restante dele:

- meta 18 com dois livros saudáveis → **11 + 7**;
- meta 18 com um livro só → **18**;
- meta 18, principal com 3 restantes, próximo com 300 → **3 + 15**.

Com meta **< 10** o teto não se aplica. Com meta ≥ 10 e sem principal, o primeiro
elegível leva o dia inteiro.

### 8. Alternância de gênero

Com mais de um livro, o próximo é o **primeiro da ordem com gênero diferente** do
anterior. Só repete gênero se não houver outra opção. O principal é sempre o
primeiro bloco.

### 9. Arredondamento com corte em 0,7

Para 60% e 70%, a fração **maior que 0,7 sobe**; 0,7 ou menos desce. A conta é
inteira: 21 × 60% = 12,6 → **12**; 28 × 60% = 16,8 → **17**; 21 × 70% = 14,7 →
**14**.

| Conta | Valor | Vira |
|---|---|---|
| 60% de 10 · 18 · 21 · 28 | 6,0 · 10,8 · 12,6 · 16,8 | 6 · 11 · 12 · 17 |
| 70% de 3 · 18 · 21 · 27 | 2,1 · 12,6 · 14,7 · 18,9 | 2 · 12 · 14 · 19 |

### 10. Nunca passar da meta nem do livro

A soma dos blocos nunca passa de `goal` nem do restante de cada livro. Não há
bloco de 0 página e um livro não aparece duas vezes. Se os livros acabarem antes
da meta, o plano é parcial (não é erro e não vira `no-books`).

### 11. Sugestão paralela, sem cobrança

Com principal, os blocos seguintes vêm com `suggestion: true`: leitura paralela
que alterna o gênero, não obrigação. Sem principal, o primeiro da fila é o
**plano** (`suggestion: false`). A UI mostra o selo "sugestão" para bloco
`queued`, mesmo quando ele é o plano; `reading` nunca leva o selo. O flag
`suggestion` continua no motor; o selo da tela segue o status.

### 12. Sem livro elegível

Sem `reading`/`queued` com páginas restantes, o plano vem vazio com
`emptyReason: 'no-books'`. A meta e a volta leve continuam calculadas, para a tela
explicar o dia.

## Exemplos

Todos com `goalPages = 18`, dia 2026-10-31 e sem sessão recente, salvo aviso.

| Cenário | Plano | Observação |
|---|---|---|
| Duna (fantasia, 300) + Cem Anos (romance, 200) | 11 Duna + 7 Cem | Cem entra como sugestão |
| Duna com 3 + Cem com 200 | 3 Duna + 15 Cem | Duna fecha; Cem completa |
| Só Duna com 300 | 18 Duna | Teto flexível |
| Volta leve (3 dias), Duna 300 + Cem 200 | 7 Duna + 5 Cem | Meta 12; teto 7 |
| Nenhum "Lendo"; Cem na fila | 18 Cem | `source: queue`, sem sugestão |
| Meta 9, Duna 300 · Duna com 4 + Cem 200 | 9 Duna · 4 Duna + 5 Cem | Meta pequena não divide |
| Nenhum livro elegível | vazio | `emptyReason: no-books` |

## O que o motor não faz

- Não grava o plano, não edita blocos e não marca "feito".
- Não reordena a fila, não sugere livros e não calcula estatísticas.
- Não estima minutos, não notifica e não chama IA. Não desconta o que já foi lido
  hoje: o plano é **bruto**; a UI compara com as sessões para mostrar progresso.
