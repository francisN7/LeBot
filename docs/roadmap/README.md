# Roadmap

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

## Como funciona

- **Ciclo** agrupa fases com o mesmo objetivo; vive em `main.md` enquanto está
  ativo.
- **Fase** agrupa sessões com o mesmo tema (ex.: documentação, código).
- **Sessão** é uma entrega vertical + testes + docs + commit. Só nasce quando a
  fase é escolhida; a spec é escrita no fim da sessão anterior.
- **Ordem** é definida pelo dono. Sem prioridade declarada, o agente pergunta em
  vez de reordenar por conta própria.

## Artefatos

| Arquivo | Estado | O que é |
|---|---|---|
| [`main.md`](main.md) | **ativo** | ciclo 0002 (pós-MVP): sessões, backlog e descartados |
| [`0001-mvp.md`](0001-mvp.md) | fechado | o que o MVP entregou (S0–S13e) |
| [`../sessions/`](../sessions/) | vivo | specs das sessões |
| [`../state/CURRENT.md`](../state/CURRENT.md) | vivo | onde paramos agora |

## Convenção de nomes

- **`main.md`** é sempre o roadmap ativo; é o único que muda no dia a dia.
- Quando um ciclo fecha, `main.md` é renomeado para **`NNNN-titulo.md`** (quatro
  dígitos, ordem cronológica) e vira histórico. Um novo `main.md` começa.
- O `README.md` é o índice; não guarda fases.
- O caminho `docs/roadmap/main.md` desambigua do branch `main`; o nome não tem
  espaço nem acento.

## Ciclo de vida

1. A spec da próxima sessão nasce no encerramento da anterior
   (`docs/sessions/SNN-titulo.md`). Specs futuras são permitidas se a sessão
   estiver na tabela de `main.md`.
2. No encerramento, a linha da sessão em `main.md` recebe entrega, aceite e
   `[x]`, e a spec sai com `git rm`.
3. Ciclo fechado: `git mv main.md NNNN-titulo.md`, cabeçalho de histórico, novo
   `main.md` e uma linha na tabela acima.

## Definition of Ready (de uma spec)

1. Objetivo em uma frase observável.
2. Fora de escopo explícito.
3. Tarefas numeradas.
4. Critérios de aceite verificáveis.
5. Orçamento de contexto (arquivos e limite de linhas).
6. Riscos e como detectar cedo.

## Definition of Done

- lint, typecheck, testes e `docs:check` verdes;
- funciona no Android (Expo Go ou APK);
- docs afetados, `CURRENT.md` e roadmap atualizados; `CHANGELOG.md` se houve
  mudança visível;
- commit `SXX: resumo curto`.

## Regras de numeração

- Sessão nova dentro da mesma fase usa letra: `S13a`, `S13b`, `S13c`.
- `S3.2` e `S7.1` eram exceções antigas; nos docs vivos valem `S3a` e `S7a`.
- ADRs e o CHANGELOG antigo mantêm os nomes da época.
