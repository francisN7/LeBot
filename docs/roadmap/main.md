# Roadmap atual

Ciclo ativo: **0002 — Pós-MVP**. Objetivo: tornar o código navegável e atacar o
que mais dói no uso diário, sem perder o offline-first.
Ciclos fechados: [`README.md`](README.md) (o MVP está em
[`0001-mvp.md`](0001-mvp.md)).

Estado: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.

## Sessões

Fase 14 — Código que abre caminho: medir o labirinto antes de refatorar.

| Sessão | Entrega | Aceite | Estado |
|---|---|---|---|
| S14a | Code tour (`docs/code-tour.md`, ~7 paradas), convenções de tamanho/imports/comentário e `scripts/code-report.mjs` | `npm run code:report` lista top 10 e imports cruzados; tour linkado; sem mudar comportamento | [ ] |
| S14b | Refactor piloto de `settings/backup/format.ts` (~660 linhas): separar parse/validate/serialize | Testes verdes; formato do backup inalterado | [ ] |
| S14c+ | Refactors restantes, um por sessão, na ordem do `code-report`: `SpineArtwork` (~710), `QueueScreen` (~440), `EstanteScreen` (~410) | Testes verdes; sem mudar comportamento | [ ] |

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

## Manutenção

- **Advisories do npm/Dependabot.** 4 alertas abertos, todos no toolchain Node
  (`minimatch`, `glob`, `esbuild`, `deepmerge`); nenhum entra no APK. Fazer junto
  da próxima atualização de SDK, **nunca** com `npm audit fix --force`. Aceite:
  `npm audit` sem média/alta ou cada exceção justificada.
- **Dependabot.** Só alertas e security updates (ADR 0005).
- **SDK/React Native.** Sessão de release quando o Expo pedir; rodar
  `npx expo install --check` e a tríade de validação. **Agora:** o Expo Doctor
  reprova o CI com 10 patches do SDK 58; aceite: `npm run doctor` verde.
- **Release só manual.** Tirar o gatilho `on: push: tags` do `release.yml` (o
  publish passa a depender só de `workflow_dispatch` com `tag`), atualizar
  `guide/release.md` e um adendo na ADR 0026. Aceite: criar tag não dispara build.
- **Medição em bash.** Portar `scripts/measure-gfx.ps1` para
  `scripts/measure-gfx.sh` com os mesmos parâmetros e saída; o `.ps1` sai.
  Aceite: roda no Linux com `adb` do PATH.

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
