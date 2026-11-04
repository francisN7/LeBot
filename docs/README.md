# Mapa da documentação

Este arquivo é o índice. A regra é **abrir a seção, não o arquivo inteiro**.

> **Orçamento por sessão:** `AGENTS.md` (≤100 linhas) + `docs/state/CURRENT.md`
> (≤60) + a spec da sessão (≤90). Tudo além disso é consulta pontual: leia só a
> seção indicada abaixo. Se a informação não está aqui, ela vive no Git
> (`git log`, `git show`) ou num ADR.

## Por pergunta

| Você quer… | Leia |
|---|---|
| saber onde paramos | [`state/CURRENT.md`](state/CURRENT.md) |
| saber o que vem agora | [`roadmap.md`](roadmap.md) |
| entender as regras do agente | [`../AGENTS.md`](../AGENTS.md) |
| rodar o app pela primeira vez | [`learn/expo-for-react-devs.md`](learn/expo-for-react-devs.md) |
| testar | [`testing.md`](testing.md) |
| gerar e publicar o APK | [`release.md`](release.md) |
| entender o plano diário | [`planner-algorithm.md`](planner-algorithm.md) |
| conferir dados, schema e backup | [`data-model.md`](data-model.md) |
| usar tokens e componentes | [`design/design-system.md`](design/design-system.md) |
| ver a identidade e a arte | [`brand.md`](brand.md), [`design/assets-3d.md`](design/assets-3d.md) |
| entender camadas e fluxo | [`architecture.md`](architecture.md) |
| saber o que o app faz com seus dados | [`security-privacy.md`](security-privacy.md) |
| saber **por que** algo é assim | [`adr/`](adr/) |
| ver o que mudou | [`../CHANGELOG.md`](../CHANGELOG.md) e `release-notes-*.md` |
| ler a spec da sessão atual | [`sessions/`](sessions/) |

## Por seção (atalho)

| Preciso de… | Vá direto a | ~linhas |
|---|---|---|
| camadas | `architecture.md` → **Camadas** | 30 |
| fluxo de dados | `architecture.md` → **Fluxo de dados** | 25 |
| boot do app | `architecture.md` → **Boot** | 20 |
| uma feature (biblioteca, plano, ordem…) | `architecture.md` → seção da feature | 15–30 |
| regras do plano | `planner-algorithm.md` → **Regras** | 70 |
| tabelas e relações | `data-model.md` → **Tabelas** | 90 |
| progresso (duas cópias) | `data-model.md` → **Progresso** | 15 |
| migrações | `data-model.md` → **Migrações** | 15 |
| tokens | `design/design-system.md` → **Tokens** | 60 |
| componentes | `design/design-system.md` → **Componentes** | 150 |
| lombada e mascote | `design/assets-3d.md` → **Lombada B** / **Mascote** | 60 |
| assinatura e CI | `release.md` → **Assinatura** / **Gerar o APK** | 50 |
| publicar um Release | `release.md` → **Publicar manualmente** | 25 |
| camadas de teste | `testing.md` → **Três camadas de teste** | 60 |

## Regras do mapa

- **Referência** descreve o que **é**; não conta em que sessão foi feito.
- **ADR** guarda o **porquê** de uma decisão e não muda depois de aceito.
- **Spec de sessão** é escopo fechado e temporário: entregou, sai do caminho.
- **CURRENT** é estado, não narrativa: sem medições, diffs ou tabelas antigas.
- Documento novo só entra se responder uma pergunta que nenhum outro responde.

## Onde as coisas vão ficar (S13b)

A poda da S13b separa guia, referência e histórico: `guide/` (setup, testing,
release), `reference/` (architecture, data-model, design-system, brand,
planner), `roadmap/` (mvp fechado + next vivo) e `adr/README.md` (índice). Até
lá, os caminhos acima são os válidos.
