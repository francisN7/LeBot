# Roadmap atual

Fases e backlog pós-MVP. A ordem segue **valor para o leitor × custo × risco**:
primeiro o que deixa as próximas sessões mais baratas, depois o que mais dói no
uso diário. Um item só vira sessão quando a fase é escolhida.

## Fase 13 — Documentação e vitrine (em andamento)

- [x] **S13a — Higiene e auditoria do repositório.**
- [x] **S13b — Mapa e poda dos docs vivos.**
- [x] **S13c — Arquivo, roadmap e backlog.**
- [x] **S13d — README, screenshots e logo.**
- [ ] **S13e — Publicar o `v0.2.1` e fechar o MVP.**

## Fase 14 — Código que abre caminho

Objetivo: tornar o código navegável e medir o labirinto antes de refatorar.

- **S14a — Code tour + convenções + code report.** `docs/code-tour.md` com ~7
  paradas (boot → tema → banco → feature → testes), regras de tamanho de arquivo,
  imports e comentário ("por quê", não "o quê"), e `scripts/code-report.mjs`
  listando arquivos >250 linhas e imports cruzados. Custo M; sem mudar
  comportamento.
- **S14b — Refactor piloto: `settings/backup/format.ts`.** 590 linhas puras com
  testes; separar parse/validate/serialize e provar a convenção. Custo M; testes
  verdes, sem mudar o formato do backup.
- **S14c+ — Refactors restantes, intercalados.** `SpineArtwork` (663),
  `EstanteScreen` (380), `QueueScreen` (374); um por ciclo, na ordem do
  `code-report`. Custo M cada.

## Fase 15 — Cadastro sem digitação

- **Busca por ISBN (P1).** Quando o **primeiro campo preenchido** do formulário é
  o ISBN, buscar título, autor, páginas e capa e preencher o formulário. Custo M.
  - **Pré-requisitos:** escolher a API (Open Library ou Google Books), permissão
    `INTERNET` só nessa tela, timeout de ~5 s, erro discreto e fallback para o
    cadastro manual.
  - **Privacidade:** envia **apenas o ISBN**; nada de e-mail, nome ou acervo. A
    política em `reference/security-privacy.md` é atualizada na sessão, junto de
    um ADR sobre a exceção ao offline-first.
  - **Aceite:** ISBN válido preenche os campos e baixa a capa; livro já
    cadastrado é avisado sem duplicar; offline/sem resposta mantém o formulário
    manual; teste com API mockada e nenhum segredo no app.
  - **Não faz:** OCR de capa nem áudio.

## Fase 16 — Conforto visual

- **Temas.** Escuro + paletas alternativas (papel amarelado, alto contraste,
  sazonais), com tokens de superfície e contraste revisado nas quatro abas e nas
  lombadas. Custo M; os gêneros já guardam `color_dark`.
- **Acessibilidade.** Leitor de tela (rótulos e ações), contraste, alvo de toque
  mínimo e respeito a "reduzir movimento". Custo M; inclui teste automatizado de
  acessibilidade nos componentes principais.

## Fase 17 — Estante em escala

- **Grid ajustável.** Seletor 2/3/4 por linha, escolha em `settings`, capas e
  lombadas redimensionadas. Custo P; definir se o botão mora no cabeçalho.
- **Multisseleção.** Selecionar vários livros e aplicar status, gênero, remover
  capa ou excluir. Excluir e remover capa pedem confirmação dupla com contagem de
  5 s. Custo M; o toque longo no chip continua sendo a roda de status.

## Fase 18 — Ajuda e mascote

- **Botão (i) de ajuda por aba.** Explicação curta para **quem chega agora**, em
  linguagem de usuário (2–3 frases por aba), com o LêBot "confuso" atrás do i.
  Reaproveitar o estado `thinking`; criar um novo só se não couber. Custo P.
- **Vida do mascote.** Repertório de frases por contexto (plano pronto, meta
  batida, volta leve, estante vazia, busca sem resultado, backup, erro) com
  escolha determinística, e animações com variação por estado/tela. Custo M;
  frases e animações deixam de ser dois itens vagos.

## Fase 19 — Memória de leitura

- **Galeria de citações.** Reler os trechos salvos nas resenhas, com busca e
  filtro por livro/gênero. Custo P; `reviews.quote` já existe.
- **`finished_at`.** Data exata de conclusão em `books`, com backfill do que já
  existe e uso nas estatísticas. Custo P; acaba com a data aproximada via
  `updated_at`.

## Fase 20 — Código II

- Refactors restantes por feature, um por sessão, com testes como rede. Custo M
  cada; sem mudar comportamento.

## Manutenção (P1 quando aplicável)

- **Advisories do npm/Dependabot.** 4 alertas abertos, todos no toolchain Node
  (`minimatch`, `glob`, `esbuild`, `deepmerge`); nenhum entra no APK. Fazer junto
  da próxima atualização de SDK, **nunca** com `npm audit fix --force`. Aceite:
  `npm audit` sem média/alta ou cada exceção justificada.
- **Dependabot.** Só alertas e security updates (ADR 0005).
- **SDK/React Native.** Sessão de release quando o Expo pedir; rodar
  `npx expo install --check` e a tríade de validação.

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
