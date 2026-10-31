# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter < 80 linhas.

## Sessão
- **Atual:** pré-S0 — scaffolding de contexto
- **Última concluída:** —
- **Próxima:** S0 — Fundação (`docs/sessions/S00-fundacao.md`)

## Pronto
- Stack, escopo e roadmap fechados.
- Identidade LêBot definida (nome, paleta, sistema de lombadas).
- Arte-fonte em `brand/source/`.
- Protocolo de contexto e documentação-base criados.
- Skills globais `session-start` e `project-context-init` criadas.

## Próximo passo
Executar a S0: repositório público seguro + app Expo rodando + CI.

## Decisões abertas
- Licença da arte: MIT junto do código ou CC BY? (resolver na S0)
- Confirmar `com.francis.lebot` como package Android.
- Remover metadados EXIF dos PNGs ao exportar.

## Arquivos-chave
- `AGENTS.md`
- `docs/roadmap.md`
- `docs/sessions/S00-fundacao.md`
- `brand/source/lebot-robo@2x.png`
- `brand/source/lebot-selos@2x.png`

## Armadilhas
- Sem acentos em caminhos, variáveis ou nomes de arquivo.
- Expo Router usa `src/app/`.
- Repo é público: nada de dados pessoais em seeds, screenshots ou docs.

## Como rodar
Ainda não configurado — a S0 cria o projeto Expo.
