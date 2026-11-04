# Índice dos ADRs

Uma linha por decisão. O arquivo completo guarda contexto, alternativas e
consequências; ele não muda depois de aceito (adendos entram no próprio ADR).

| # | Decisão | Status |
|---|---|---|
| [0001](0001-stack-e-arquitetura.md) | Expo, offline-first e repositório público | Aceita |
| [0002](0002-identidade-lebot.md) | Identidade visual do LêBot | Aceita |
| [0003](0003-licenca-mit.md) | Licença MIT para código e arte | Aceita |
| [0004](0004-email-noreply.md) | E-mail `noreply` do GitHub em todos os commits | Aceita |
| [0005](0005-sem-dependabot-de-versao.md) | Sem Dependabot de versão; só alertas de segurança | Aceita |
| [0006](0006-design-system-nativewind.md) | NativeWind v4 com tokens em TypeScript | Aceita, com adendo (S4b) |
| [0007](0007-persistencia-sqlite-drizzle.md) | SQLite + Drizzle e migrações no boot | Aceita |
| [0008](0008-testes-sqlite-sqljs.md) | Testes de repositório com `sql.js` e migrações reais | Aceita |
| [0009](0009-biblioteca-busca-e-capas.md) | Busca em memória e capas no aparelho | Aceita |
| [0010](0010-generos-editaveis-e-cores.md) | Gêneros editáveis com paleta de duas cores | Aceita |
| [0011](0011-arte-vetorial-parametrica.md) | Arte vetorial paramétrica (lombadas e mascote) | Aceita |
| [0012](0012-progresso-e-status-automatico.md) | Histórico separado e status automático | Parcialmente substituída pela 0015 |
| [0013](0013-motor-do-plano.md) | Motor do plano: contrato e regras anti-ressaca | Aceita |
| [0014](0014-plano-recalculado-na-hoje.md) | Plano recalculado na Hoje, sem persistência | Aceita |
| [0015](0015-status-ao-registrar.md) | Registrar retoma livro pausado ou na fila | Aceita |
| [0016](0016-ordem-persistida.md) | Ordem persistida em `queue_items` | Complementada pela 0017 |
| [0017](0017-ordem-automatica-e-principal.md) | Ordem automática por status e principal = primeiro Lendo | Aceita |
| [0018](0018-concluir-preenche-paginas.md) | Concluir preenche as páginas lidas | Aceita, com adendo (S9) |
| [0019](0019-resenha-e-campos-extras.md) | Resenha com campos extras configuráveis | Aceita |
| [0020](0020-estatisticas.md) | Estatísticas sem biblioteca de gráfico e data derivada | Aceita |
| [0021](0021-backup-em-zip.md) | Backup manual em ZIP com JSON e capas | Aceita |
| [0022](0022-lombada-e-capa-em-svg.md) | Lombada B e capa com profundidade em SVG | Aceita |
| [0023](0023-animacao-do-tassel.md) | Balanço do tassel com `matrix` animada | Aceita |
| [0024](0024-lombada-em-camadas-e-grade-virtualizada.md) | Lombada em camadas e grade virtualizada | Aceita |
| [0025](0025-build-local-assinatura-e-github-releases.md) | Build local, assinatura fora do repo e Releases | Parcialmente substituída pela 0026 |
| [0026](0026-build-no-github-actions.md) | Build no GitHub Actions e pacote mínimo | Aceita |
| [0027](0027-estante-em-memoria-e-blocos.md) | Estante em memória e plano de blocos | Aceita (gatilho no backlog) |

## Como ler

- O ADR responde **por quê**; o código e `docs/reference/` respondem **o que é**.
- "Substituída" não apaga a decisão: mostra o que mudou e onde olhar agora.
- Decisão nova entra como `00NN-titulo-curto.md` e ganha uma linha aqui.
