# Mapa da documentação

Este arquivo é o índice. A regra é **abrir a seção, não o arquivo inteiro**.

> **Orçamento por sessão:** `AGENTS.md` (≤100 linhas) + `docs/state/CURRENT.md`
> (≤60) + a spec da sessão (≤90). Tudo além disso é consulta pontual. Se a
> informação não está aqui, ela vive no Git (`git log`, `git show`) ou num ADR.

## Quem lê o quê

| Público | Arquivos | Regra |
|---|---|---|
| 🤖 agente | `AGENTS.md`, `docs/state/CURRENT.md`, `docs/sessions/` | carregado na abertura, dentro do orçamento |
| 🤝 ambos | este mapa, `docs/roadmap/`, `docs/reference/`, `docs/guide/`, `docs/adr/` | o agente abre só a seção necessária |
| 👤 dev | `README.md`, `CHANGELOG.md`, `docs/releases/`, `docs/assets/` | o agente não carrega; só edita quando a tarefa pedir |

Humanos podem ler tudo; a tabela só diz o que o agente carrega por iniciativa.

## Por pergunta

| Você quer… | Leia |
|---|---|
| saber onde paramos | [`state/CURRENT.md`](state/CURRENT.md) |
| saber o que vem agora | [`roadmap/main.md`](roadmap/main.md) |
| ver o que já foi entregue | [`roadmap/`](roadmap/README.md) (arquivos `NNNN-*.md`) |
| entender as regras do agente | [`../AGENTS.md`](../AGENTS.md) |
| instalar, rodar e resolver problemas | [`guide/setup.md`](guide/setup.md) |
| entender o código (tour e convenções) | [`guide/code-tour.md`](guide/code-tour.md) |
| testar | [`guide/testing.md`](guide/testing.md) |
| gerar e publicar o APK | [`guide/release.md`](guide/release.md) |
| entender o plano diário | [`reference/planner.md`](reference/planner.md) |
| conferir dados, schema e backup | [`reference/data-model.md`](reference/data-model.md) |
| usar tokens e componentes | [`reference/design-system.md`](reference/design-system.md) |
| ver a identidade e a arte | [`reference/brand.md`](reference/brand.md) |
| entender camadas e fluxo | [`reference/architecture.md`](reference/architecture.md) |
| saber o que o app faz com seus dados | [`reference/security-privacy.md`](reference/security-privacy.md) |
| saber por que o app pesa e o orçamento de desempenho | [`reference/performance.md`](reference/performance.md) |
| saber **por que** algo é assim | [`adr/`](adr/README.md) |
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
| orçamento de desempenho | `reference/performance.md` → **Orçamento** | 20 |
| assinatura e CI | `guide/release.md` → **Assinatura** / **Gerar o APK** | 45 |
| publicar um Release | `guide/release.md` → **Publicar manualmente** | 25 |
| camadas de teste | `guide/testing.md` → **Três camadas** | 25 |
| convenções de código | `guide/code-tour.md` → **Convenções** | 15 |

## Regras do mapa

- **Guide** responde "como eu faço"; **reference**, "como X é".
- **ADR** guarda o **por quê** e não muda depois de aceito.
- **Spec de sessão** é escopo fechado e temporário: no encerramento, entrega e
  aceite viram linha em `roadmap/main.md` e a spec sai (`git rm`).
- **CURRENT** é estado, não narrativa: sem medições, diffs ou tabelas antigas.
- Referência não conta em que sessão a coisa foi feita; isso é histórico.
- Documento novo só entra se responder uma pergunta que nenhum outro responde.
- Só liste aqui arquivos que existem (o `docs:check` acusa link quebrado).

## O que é histórico

`CHANGELOG.md`, `docs/releases/`, os ADRs e as specs de sessão registram o
passado ou o futuro próximo: nomes citados neles podem não existir mais. O
`npm run docs:check` ignora os links desses quatro, exceto o índice
`adr/README.md`.
