# Mapa da documentação

Este arquivo é o índice. A regra é **abrir a seção, não o arquivo inteiro**.

> **Orçamento por sessão:** `AGENTS.md` (≤100 linhas) + `docs/state/CURRENT.md`
> (≤60) + a spec da sessão (≤90). Tudo além disso é consulta pontual. Se a
> informação não está aqui, ela vive no Git (`git log`, `git show`) ou num ADR.

## Por pergunta

| Você quer… | Leia |
|---|---|
| saber onde paramos | [`state/CURRENT.md`](state/CURRENT.md) |
| saber o que vem agora | [`roadmap/next.md`](roadmap/next.md) |
| entender as regras do agente | [`../AGENTS.md`](../AGENTS.md) |
| instalar, rodar e resolver problemas | [`guide/setup.md`](guide/setup.md) |
| testar | [`guide/testing.md`](guide/testing.md) |
| gerar e publicar o APK | [`guide/release.md`](guide/release.md) |
| entender o plano diário | [`reference/planner.md`](reference/planner.md) |
| conferir dados, schema e backup | [`reference/data-model.md`](reference/data-model.md) |
| usar tokens e componentes | [`reference/design-system.md`](reference/design-system.md) |
| ver a identidade e a arte | [`reference/brand.md`](reference/brand.md) |
| entender camadas e fluxo | [`reference/architecture.md`](reference/architecture.md) |
| saber o que o app faz com seus dados | [`reference/security-privacy.md`](reference/security-privacy.md) |
| saber **por que** algo é assim | [`adr/`](adr/) |
| ver o que mudou | [`../CHANGELOG.md`](../CHANGELOG.md) e [`releases/`](releases/) |
| ler a spec da sessão atual | [`sessions/`](sessions/) |

## Por seção (atalho)

| Preciso de… | Vá direto a | ~linhas |
|---|---|---|
| camadas | `reference/architecture.md` → **Camadas** | 30 |
| fluxo de dados | `reference/architecture.md` → **Fluxo de dados** | 25 |
| boot do app | `reference/architecture.md` → **Boot** | 15 |
| uma feature | `reference/architecture.md` → seção da feature | 15–30 |
| regras do plano | `reference/planner.md` → **Regras** | 70 |
| tabelas e relações | `reference/data-model.md` → **Tabelas** | 90 |
| progresso (duas cópias) | `reference/data-model.md` → **Progresso** | 15 |
| tokens | `reference/design-system.md` → **Tokens** | 55 |
| componentes | `reference/design-system.md` → **Componentes** | 60 |
| lombada e mascote | `reference/brand.md` → **Lombada** / **Mascote** | 70 |
| assinatura e CI | `guide/release.md` → **Assinatura** / **Gerar o APK** | 45 |
| publicar um Release | `guide/release.md` → **Publicar manualmente** | 25 |
| camadas de teste | `guide/testing.md` → **Três camadas** | 25 |

## Regras do mapa

- **Guide** responde "como eu faço"; **reference**, "como X é".
- **ADR** guarda o **por quê** e não muda depois de aceito.
- **Spec de sessão** é escopo fechado e temporário: entregou, sai do caminho.
- **CURRENT** é estado, não narrativa: sem medições, diffs ou tabelas antigas.
- Referência não conta em que sessão a coisa foi feita; isso é histórico.
- Documento novo só entra se responder uma pergunta que nenhum outro responde.

## O que é histórico

`CHANGELOG.md`, `docs/releases/` e os ADRs registram o passado: nomes de
documentos e sessões citados neles podem não existir mais. O `npm run docs:check`
valida os documentos vivos e ignora esses três.
