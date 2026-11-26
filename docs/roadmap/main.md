# Roadmap atual

Ciclo ativo: **0002 — Pós-MVP**. Objetivo: tornar o código navegável e atacar o
que mais dói no uso diário, sem perder o offline-first.
Ciclos fechados: [`README.md`](README.md) (o MVP está em
[`0001-mvp.md`](0001-mvp.md)).

Estado: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

## Sessões

Fase 14 — Código que abre caminho: medir o labirinto antes de refatorar.
Por decisão do dono (2026-11-26), a análise de leveza e vida entra antes dos
refactors. Depois da S14b, as duas sessões de leveza (S14c, S14d) entram antes da
vida, e vida e refactors andam duas letras (S14e, S14f, S14g+). O stack fica
(ADR 0029).

| Sessão | Entrega | Aceite | Estado |
|---|---|---|---|
| S13f | Manutenção: SDK 58 alinhado (`expo` 58.1.0 + plugins `expo-image`/`expo-status-bar`), release só por `workflow_dispatch` (adendo na ADR 0026), `measure-gfx.sh` no lugar do `.ps1` e hooks do Husky executáveis | `npm run doctor` 20/20 local (CI após o push); YAML só com `workflow_dispatch` (lido, sem run real); `measure-gfx.sh --help` ok, sem `shellcheck` e sem aparelho | [x] |
| S14a | Code tour em `docs/guide/code-tour.md` (7 paradas + convenções de tamanho, imports e comentário) e `npm run code:report` com linha de base: 150 arquivos/16.095 linhas, 12 acima de 250, 26 imports profundos entre features | `code:report` lista top 10, pastas e imports cruzados; tour linkado no mapa e no AGENTS; só docs e script novo; lint, typecheck, 517 testes e docs verdes | [x] |
| S14b | Análise de desempenho em `docs/reference/performance.md`: APK `v0.2.1` (`e44b2c…3ab6`) no edge 50 ultra com 3 reais, 3/200/1.000 fictícios; causas: loops `withRepeat(-1)` sem pausa (aba escondida 90% de um núcleo), lombada SVG animada, Ordem O(n) (2,3 s com 1.000) e fade de 400 ms da splash; caminho A (ajustar no stack) e orçamento na ADR 0029 | Medições com hash do APK; decisão do dono registrada; S14c/S14d novas; nenhuma mudança no app; `docs:check` verde | [x] |
| S14c | Leveza I: animação com hora para acabar — pausar fora de foco, tirar os loops perpétuos de `Mascot`, `SpineArtwork`, `SpineFace`, `BookCover` e `QueueRow`, respeitar "reduzir movimento"; medidores da S14b em `scripts/` | Orçamento de **parado** e **aba escondida** da ADR 0029 no APK de release (f200); testes verdes | [ ] |
| S14d | Leveza II: Ordem sem trabalho O(n) na montagem (profiler antes), fade da splash ~150 ms, custo da célula de lombada na rolagem e APK por ABI | Orçamento de boot, 1ª visita, rolagem e PSS da ADR 0029; se a rolagem não fechar, decidir o caminho B | [ ] |
| S14e | Análise de vida (A2): onde dar mais movimento e personalidade dentro do orçamento da ADR 0029 | Relatório em `docs/`, itens novos no backlog; nenhuma mudança no app | [ ] |
| S14f | Refactor piloto de `settings/backup/format.ts` (~660 linhas): separar parse/validate/serialize | Testes verdes; formato do backup inalterado | [ ] |
| S14g+ | Refactors restantes, um por sessão, na ordem do `code-report`: `SpineArtwork` (~710), `QueueScreen` (~440), `EstanteScreen` (~410) | Testes verdes; sem mudar comportamento | [ ] |

Ordem: a tabela, depois as fases do backlog na ordem abaixo. A ordem segue
**valor para o leitor × custo × risco**: primeiro o que deixa as próximas sessões
mais baratas, depois o que mais dói no uso diário. Um item só vira sessão quando
a fase é escolhida.

Ao concluir uma sessão, a linha recebe a entrega observável e o aceite
verificado, e o estado vira `[x]`. Ao fechar o ciclo, este arquivo vira
`NNNN-titulo.md` sem reescrever a tabela.

## Backlog

| Fase | Item | Custo | Pré-requisito |
|---|---|---|---|
| 15 — Cadastro sem digitação | **P1** — Busca por ISBN (detalhe abaixo) | M | escolher a API; ADR da exceção ao offline-first |
| 16 — Conforto visual | Temas: escuro + paletas (papel amarelado, alto contraste, sazonais), tokens de superfície e contraste revisado nas quatro abas e nas lombadas | M | gêneros já guardam `color_dark` |
| 16 — Conforto visual | Acessibilidade: leitor de tela (rótulos e ações), contraste, alvo de toque mínimo e "reduzir movimento"; teste automatizado nos componentes principais | M | — |
| 17 — Estante em escala | Grid ajustável 2/3/4 por linha, escolha em `settings`, capas e lombadas redimensionadas | P | definir se o botão mora no cabeçalho |
| 17 — Estante em escala | Multisseleção: status, gênero, remover capa ou excluir; excluir e remover capa pedem confirmação dupla com contagem de 5 s | M | o toque longo no chip continua sendo a roda de status |
| 18 — Ajuda e mascote | Botão (i) por aba: 2–3 frases para **quem chega agora**, com o LêBot "confuso" (reaproveitar `thinking`) | P | — |
| 18 — Ajuda e mascote | Vida do mascote: frases por contexto (plano pronto, meta batida, volta leve, estante vazia, busca sem resultado, backup, erro) com escolha determinística e animações por estado/tela | M | — |
| 19 — Memória de leitura | Galeria de citações com busca e filtro por livro/gênero | P | `reviews.quote` já existe |
| 19 — Memória de leitura | `finished_at` em `books`, com backfill e uso nas estatísticas (acaba com a data aproximada via `updated_at`) | P | — |
| 20 — Código II | Refactors restantes por feature, um por sessão, com testes como rede | M cada | Fase 14 |

**Busca por ISBN.** Quando o **primeiro campo preenchido** do formulário é o
ISBN, buscar título, autor, páginas e capa e preencher o formulário.

- **Pré-requisitos:** escolher a API (Open Library ou Google Books), permissão
  `INTERNET` só nessa tela, timeout de ~5 s, erro discreto e fallback para o
  cadastro manual.
- **Privacidade:** envia **apenas o ISBN**; nada de e-mail, nome ou acervo. A
  política em `reference/security-privacy.md` é atualizada na sessão, junto de
  um ADR sobre a exceção ao offline-first.
- **Aceite:** ISBN válido preenche os campos e baixa a capa; livro já cadastrado
  é avisado sem duplicar; offline/sem resposta mantém o formulário manual; teste
  com API mockada e nenhum segredo no app.
- **Não faz:** OCR de capa nem áudio.

**Leveza e vida (S14b → S14e).** S14b e S14e são **só de análise, decisão e
planejamento**: nenhuma muda código do app. A S14b virou as sessões de leveza
S14c e S14d (relatório em `reference/performance.md`, ADR 0029); a S14e planeja
a vida já sobre o app leve.

- **S14b (A1) — Desempenho.** O app parece pesado mesmo sendo simples, enquanto há
  apps com muito mais animação que são leves. Medir no APK de release (boot,
  troca de abas, Estante, memória e tamanho), achar as causas e comparar
  caminhos. **Nada é intocável:** linguagem, framework, arquitetura e decisões
  anteriores podem mudar se o ganho justificar; mudança de direção vira ADR.
- **S14e (A2) — Vida.** Com o orçamento de desempenho da ADR 0029, revisar telas, transições,
  estados vazios, feedback de toque e o mascote para dar mais vida a tudo, sem
  comprometer funcionamento nem leveza. Absorve ou reordena a Fase 18 se fizer
  sentido.
- **Aceite (de cada uma):** relatório em `docs/` com medições e evidências,
  decisões (ADR quando relevante) e itens novos no backlog; zero mudança de
  comportamento no app.

## Manutenção

- **Advisories do npm/Dependabot.** 4 alertas abertos, todos no toolchain Node
  (`minimatch`, `glob`, `esbuild`, `deepmerge`); nenhum entra no APK. Fazer junto
  da próxima atualização de SDK, **nunca** com `npm audit fix --force`. Aceite:
  `npm audit` sem média/alta ou cada exceção justificada.
- **Dependabot.** Só alertas e security updates (ADR 0005).
- **SDK/React Native.** Sessão de release quando o Expo pedir; rodar
  `npx expo install --check` e a tríade de validação (a S13f alinhou o SDK 58).

## Gatilhos (não são backlog)

- **Estante em blocos:** só acima de ~2.000 livros; hoje a base inteira cabe em
  memória e a rolagem não faz I/O (ADR 0027).
- **Ordem — drop via alça:** reavaliar só se a lista voltar a piscar; setas e
  paginação já cobrem.
- **NativeWind 5:** quando o SDK/RN exigir Tailwind 4 ou o aviso de
  `ImageBackground` bloquear algo (ADR 0006).

## Descartados (não voltam sem decisão nova)

- **Sync multi-dispositivo** — custo G e muda o modelo de dados.
- **Importação Goodreads** — sem uso se o acervo não está lá.
- **Recomendações com IA** — contradiz o motor determinístico e offline.
- **Audiobook tracking** — outro produto.
- **OCR de capa** — substituído pela busca por ISBN.
- **Widget de progresso** — Android-only, manutenção alta.
- **Compartilhar resenhas** — puxa imagem/rede e foge do offline-first.
