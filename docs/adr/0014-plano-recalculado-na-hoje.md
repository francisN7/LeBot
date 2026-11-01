# ADR 0014 — Plano do dia recalculado na tela Hoje, sem persistência

- **Status:** aceito
- **Data:** 2026-10-31
- **Sessão:** S7

## Contexto

A S6 entregou `buildPlan` puro e determinístico. A spec da S7 abria três
decisões que mudavam o modelo de dados e a tela:

1. persistir o plano em `daily_plans` (congelar o dia e permitir edição) ou
   recalcular a cada abertura;
2. permitir edição manual dos blocos nesta sessão;
3. como mostrar os blocos `suggestion` (livro paralelo ao ativo).

O risco conhecido era criar uma segunda fonte de verdade para o progresso: o
plano gravado e `pages_read`/sessões poderiam divergir, ainda mais com o registro
de leitura atualizando o livro na hora.

## Decisão

### Recalcular a cada abertura

A tela Hoje chama `buildPlan` a cada montagem/atualização, com dados que já
existem: livros, `settings`, sessões recentes e a ordem da fila. Não há tabela
nova, migração nem "plano aprovado". As sessões e `pages_read` continuam sendo a
única fonte de verdade do progresso.

### Sem edição manual nesta sessão

O dono só pode registrar leitura a partir de um bloco. Trocar livro, mudar
páginas ou remover bloco não entra na S7. Se a edição virar prioridade, ela vem
junto com a persistência numa sessão própria (S7.1).

### Sugestão na mesma lista, com selo

Os blocos `suggestion` aparecem abaixo dos principais, com o selo "sugestão".
Nada escondido atrás de um toque: a decisão do motor fica visível, e o dono
escolhe se alterna o gênero ou não.

### Estado do bloco derivado, não gravado

`plan-view.ts` compara o plano bruto com as sessões de hoje: um bloco fica
`done` quando as páginas lidas hoje alcançam o bloco (ou o livro acabou), o
primeiro principal pendente vira `now` e os demais ficam `later`. A sugestão só
vira `now` quando não há principal pendente. Nada disso é persistido.

### Ordem da fila por um seam da feature `queue`

A Hoje recebe a ordem de `useQueueBookIds()`, que hoje devolve a fixture. A S8
troca o interior do hook pela fila persistida sem tocar na tela nem no motor.

## Consequências

- Zero migração e zero sincronização: registrar leitura atualiza a Hoje na hora
  via `notifyBooksChanged` + assinatura das sessões.
- O dia é estável: com a mesma meta e o mesmo restante, o motor devolve os
  mesmos blocos; o lido hoje aparece na comparação, não como subtração.
- Abrir o app depois da meia-noite recalcula com o dia novo (`useDailyPlan`
  deriva o dia por ano/mês/dia).
- Edição manual de plano fica explicitamente fora do MVP até nova decisão.
- `useRecentSessions` busca a janela de 7 dias mais a sessão mais recente de
  qualquer data, o que cobre o livro ativo e a volta leve com duas consultas ao
  repositório (`listBetween` + `latest`).

## Alternativas descartadas

- **`daily_plans` + blocos:** permitiria edição, mas cria segunda fonte de
  verdade e exige decidir quem manda quando o progresso muda.
- **Plano aprovado em `settings`:** mesmo problema, com um snapshot sem schema.
- **Descontar o lido hoje no motor:** os blocos mudariam a cada registro e o
  plano deixaria de ser um alvo estável do dia.
- **Esconder a sugestão atrás de um toque:** reduz a tela, mas esconde a
  decisão do motor e o convite à alternância de gênero.

## Adendo (2026-11-01, S7.1)

O selo "sugestão" saiu da Hoje. O bloco paralelo vem do topo da Ordem, que é
escolha do dono, não uma proposta do app; chamá-lo de sugestão confundia a
origem com o papel no plano. O motor mantém `suggestion: true` e a UI não mostra
o selo. Ele volta se existir um livro proposto fora da Ordem.

