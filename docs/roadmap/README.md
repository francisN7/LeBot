# Roadmap

Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

## Como funciona

- **Fase** agrupa sessões com o mesmo tema (ex.: documentação, código).
- **Sessão** é uma entrega vertical + testes + docs + commit. Só nasce quando a
  fase é escolhida; a spec é escrita no fim da sessão anterior.
- **Ordem** é definida pelo dono. Sem prioridade declarada, o agente pergunta em
  vez de reordenar por conta própria.

## Artefatos

| Arquivo | O que é |
|---|---|
| [`mvp.md`](mvp.md) | o que foi entregue até o `v0.2.1` (fechado) |
| [`next.md`](next.md) | fases e backlog pós-MVP (vivo) |
| [`../sessions/`](../sessions/) | specs das sessões vivas |
| [`../state/CURRENT.md`](../state/CURRENT.md) | onde paramos agora |

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
- docs afetados, `CURRENT.md`, roadmap e `CHANGELOG.md` atualizados;
- commit `SXX: resumo curto`.

## Regras de numeração

- Sessão nova dentro da mesma fase usa letra: `S13a`, `S13b`, `S13c`.
- `S3.2` e `S7.1` eram exceções antigas; nos docs vivos valem `S3a` e `S7a`.
- ADRs e o CHANGELOG antigo mantêm os nomes da época.
