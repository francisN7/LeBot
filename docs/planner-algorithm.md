# Motor do plano diário

O motor da S6 responde uma pergunta só: **quais livros ler hoje e quantas páginas
em cada um**. Ele é uma função pura (`buildPlan`) em
`src/features/planner/engine/`: não importa React Native, banco, rede ou IA, não
lê o relógio global e não usa aleatoriedade. A S7 mostra o plano; desde a S8 a
ordem vem de `queue_items`, não de fixture.

## Entrada

| Campo | O que é |
|---|---|
| `today` | dia de referência (`Date`); o motor usa o **dia local** do aparelho |
| `goalPages` | meta de `settings.goal.pages`; limitada a 3–200 |
| `books` | id, gênero, status, total de páginas e páginas lidas |
| `sessions` | histórico que inclua a última sessão de cada livro e a última sessão geral; o motor ignora o que for mais antigo |
| `queueBookIds` | ordem da fila; sem ela, vale a ordem de `books` |

O motor não valida Zod: o chamador entrega dados já tipados. Valores inválidos de
meta são tratados (ver abaixo), e livros inexistentes na fila são ignorados.

## Saída

`Plan` tem o dia (`YYYY-MM-DD`), a meta pedida (`baseGoal`), a meta do dia
(`goal`), o total (`pages`), os blocos (`entries`), a marca de volta leve
(`lightDay`) e o motivo de plano vazio (`emptyReason: 'no-books'`).

Cada bloco traz `bookId`, `pages`, `source` (`active`/`queue`), `finishes` (o
plano cobre o restante do livro) e `suggestion` (leitura paralela opcional).

## Regras

### 1. Meta entre 3 e 200

`goalPages` é truncada para inteiro e limitada a **3–200**. `0`, negativo,
`NaN` ou infinito caem em **3**; acima de 200 vira **200**. Com meta menor que
10 o motor **não divide o dia**: o primeiro livro leva a meta inteira (o segundo
só entra se o primeiro acabar). É por isso que metas pequenas quase sempre
recomendam um livro só.

### 2. O dia é local, e entra por parâmetro

O motor nunca chama `new Date()` nem `Date.now()`. `today` e `readAt` são
instantes; a conta usa ano/mês/dia **locais** (`getFullYear`, `getMonth`,
`getDate`), nunca UTC. Uma sessão às 23:59 pertence àquele dia. Duas sessões no
mesmo dia contam como um dia só. Se o aparelho trocar de fuso, um instante
limítrofe pode mudar de dia — é o comportamento esperado.

### 3. Livros elegíveis

Entram `reading` e `queued` com páginas restantes (`pages - pagesRead > 0`).
**`paused` e `finished` nunca entram.** Pausar é uma decisão do dono; o motor não
insiste.

### 4. Livro ativo: o "Lendo" que você leu de verdade

Entre os livros `reading`, o ativo é o que tem a **sessão mais recente nos
últimos 7 dias de calendário** (hoje + 6 anteriores). Empate: primeiro na ordem
da fila. Sem sessão nessa janela, não há ativo — um livro largado há uma semana
não ocupa a frente do plano.

### 5. Volta leve: meta a 70% depois de 3 dias

Se a **última sessão de qualquer livro** foi há **3 dias ou mais**, o dia é
"volta leve": a meta cai para 70% (mínimo de 1 página). Sem nenhuma sessão no
histórico, não é volta leve: usuário novo recebe a meta normal. A redução usa a
mesma regra de arredondamento e vale para a meta efetiva do dia. **O chamador
precisa passar a última sessão mesmo que ela seja mais antiga que a janela do
ativo**; um recorte de 7 dias esconderia uma volta de 30 dias.

### 6. Ordem: ativo, fila, resto

1. o livro ativo, quando existe;
2. os ids de `queueBookIds`, na ordem recebida;
3. os demais elegíveis, na ordem de `books`.

Ids desconhecidos, repetidos ou de livro concluído são ignorados. Um livro que
não está na fila ainda pode entrar no plano como alternativa.

### 7. Teto de 60%: preferência, não parede

Com livro ativo e meta do dia **≥ 10**, cada livro recebe no máximo 60% da meta
(arredondado pela regra abaixo). Se a soma dos outros livros não fechar a meta,
o último bloco (ou o ativo) pode passar dos 60% até o restante dele. Assim:

- meta 18 com dois livros saudáveis → **11 + 7**;
- meta 18 com um livro só → **18** (o teto não deixa o dia pela metade);
- meta 18, ativo com 3 páginas restantes, próximo com 300 → **3 + 15**.

Com meta **< 10** o teto não se aplica: o primeiro livro leva o dia inteiro. Com
meta ≥ 10 e sem ativo, o primeiro da fila também leva o dia inteiro (até
acabar) — não há por que dividir a estreia de um livro.

### 8. Alternância de gênero

Quando o plano tem mais de um livro, o próximo é o **primeiro da ordem com
gênero diferente** do anterior. Só repete gênero se não houver outra opção. O
ativo é sempre o primeiro bloco.

### 9. Arredondamento com corte em 0,7

Para 60% e 70%, a fração **maior que 0,7 sobe**; 0,7 ou menos desce. A conta é
inteira (sem ponto flutuante): 21 × 60% = 12,6 → **12**; 28 × 60% = 16,8 → **17**;
21 × 70% = 14,7 → **14**.

| Conta | Valor | Vira |
|---|---|---|
| 60% de 10 | 6,0 | 6 |
| 60% de 18 | 10,8 | 11 |
| 60% de 21 | 12,6 | 12 |
| 60% de 28 | 16,8 | 17 |
| 70% de 3 | 2,1 | 2 |
| 70% de 18 | 12,6 | 12 |
| 70% de 21 | 14,7 | 14 |
| 70% de 27 | 18,9 | 19 |

### 10. Nunca passar da meta nem do livro

A soma dos blocos nunca passa de `goal` nem do restante de cada livro. Não há
bloco de 0 página e um livro não aparece duas vezes. Se os livros acabarem antes
da meta, o plano é parcial (não é erro e não vira `no-books`).

### 11. Sugestão paralela, sem cobrança

Quando há livro ativo, os blocos seguintes vêm com `suggestion: true`: são a
leitura paralela que alterna o gênero, não uma obrigação. Sem livro ativo, o
primeiro da fila é o **plano** (`suggestion: false`), não uma sugestão. Desde a
S7.1 a UI mostra o selo "sugestão" para bloco `queued` (Pretendo Ler), mesmo
quando ele é o plano do dia; livro `reading` nunca leva o selo. O flag
`suggestion` continua no motor; o selo da tela segue o status.

### 12. Sem livro elegível

Se não há livro `reading`/`queued` com páginas restantes, o plano vem vazio com
`emptyReason: 'no-books'`. A meta e a volta leve continuam calculadas, para a
tela poder explicar o dia.

## Exemplos

Todos com `goalPages = 18`, dia 2026-10-31 e sessão do ativo hoje, salvo aviso.

| Cenário | Plano | Observação |
|---|---|---|
| Duna (fantasia, 300 restantes) + Cem Anos (romance, 200) | 11 Duna + 7 Cem | Cem entra como sugestão |
| Duna com 3 restantes + Cem com 200 | 3 Duna + 15 Cem | Duna fecha; Cem completa |
| Só Duna com 300 | 18 Duna | Teto flexível |
| Volta leve (3 dias), Duna 300 + Cem 200 | 7 Duna + 5 Cem | Meta 12; teto 7 |
| Nenhum "Lendo"; Cem na fila | 18 Cem | `source: queue`, sem sugestão |
| Meta 9, Duna 300 | 9 Duna | Meta pequena não divide |
| Meta 9, Duna com 4 restantes + Cem 200 | 4 Duna + 5 Cem | Cem é sugestão |
| Nenhum livro elegível | vazio | `emptyReason: no-books` |

## O que o motor não faz

- Não grava o plano no banco, não edita blocos e não marca "feito".
- Não reordena a fila, não sugere novos livros para a estante e não calcula
  sequência/estatísticas.
- Não estima minutos, não manda notificação e não chama IA.
- Não desconta o que você já leu hoje: o plano é **bruto** (a meta do dia). A UI
  compara com as sessões de hoje para mostrar progresso.

As decisões e alternativas descartadas estão na
[ADR 0013](adr/0013-motor-do-plano.md).
