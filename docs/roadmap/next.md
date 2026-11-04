# Próximo

Fases e backlog pós-MVP. **A ordem é do dono**; a proposta abaixo está aberta
para confirmação e ajuste. Um item só vira sessão quando a fase é escolhida.

## Fase 13 — Documentação e vitrine (em andamento)

- [x] **S13a — Higiene e auditoria do repositório.**
- [x] **S13b — Mapa e poda dos docs vivos.**
- [x] **S13c — Arquivo, roadmap e backlog.**
- [ ] **S13d — README, screenshots e logo.**
- [ ] **S13e — Publicar o `v0.2.1` e fechar o MVP.**

## Fase 14 — Código (proposta)

Objetivo: deixar o código legível e navegável sem virar labirinto.

- **S14a — Code tour e convenções.** `docs/code-tour.md` com ~7 paradas (boot →
  tema → banco → feature → testes); regras de tamanho de arquivo, imports e
  comentário ("por quê", não "o quê"); `scripts/code-report.mjs` lista arquivos
  acima de 250 linhas. Custo M; não muda comportamento.
- **S14b+ — Refactor por feature.** Um por sessão, com testes verdes:
  `settings/backup/format.ts` (590), `SpineArtwork.tsx` (663),
  `EstanteScreen.tsx` (380), `QueueScreen.tsx` (374). Custo M cada.

## Produto (ordem proposta)

| Item | Valor | Custo | Observação |
|---|---|---|---|
| **Temas** (escuro + paletas) | conforto e identidade | M | os gêneros já guardam `color_dark` |
| **Acessibilidade** | leitor de tela, contraste e alvo de toque | M | revisar as 4 abas e a roda |
| **Vida do mascote** | frases por contexto + respiração/gestos | M | funde "frases" e "animações" |
| **Grid ajustável** | 2/3/4 por linha, escolha em `settings` | P | definir se o botão mora no cabeçalho |
| **Multisseleção** | status/gênero/remover capa em lote | M | excluir pede confirmação dupla |
| **Galeria de citações** | reler trechos por livro/gênero | P | `reviews.quote` já existe |
| **Data exata de conclusão** | `finished_at` com backfill | P | acaba com a data aproximada |
| **Botão (i) de ajuda** | explicar cada aba | P | mascote "confuso" |
| **Widget de progresso** | plano do dia na home | M | Android |
| **Sync multi-dispositivo** | dois aparelhos, mesma estante | G | opt-in, com exclusão real |
| **Compartilhar resenhas** | imagem/texto | P | depende da galeria |
| **Importação Goodreads** | trazer acervo | M | CSV |
| **Recomendações com IA** | sugestão de próximo livro | G | via proxy, sem chave no app |
| **Audiobook/OCR de capa** | formatos e capa pela câmera | G | avaliar antes |

## Manutenção

- **Advisories do npm/Dependabot (P1).** 4 alertas abertos, todos no toolchain
  Node (`minimatch`, `glob`, `esbuild`, `deepmerge`); nenhum entra no APK. Fazer
  junto da próxima atualização de SDK, **nunca** com `npm audit fix --force`.
  Critério: `npm audit` sem alertas de severidade média/alta ou cada exceção
  registrada com justificativa.
- **NativeWind 5 (gatilho).** Só quando o SDK/RN exigir Tailwind 4 ou o aviso de
  `ImageBackground` bloquear algo. Custo de uma sessão de configuração (ADR 0006).
- **Dependabot.** Manter só alertas e security updates (ADR 0005).

## Gatilhos (não são backlog)

- **Estante em blocos:** só acima de ~2.000 livros. Hoje a estante lê a base
  inteira no mount e rola sem I/O (ADR 0027).
- **Ordem — drop via alça:** reavaliar só se a lista crescer a ponto de piscar;
  as setas e a paginação já cobrem o uso.
- **Tema escuro:** entra junto de "Temas".

## Descartados

- Itens de toolchain que não mudam o produto (advisories e NativeWind 5) saíram
  do backlog de produto e vivem em **Manutenção**.
- "Refinamento de animações" e "frases do mascote" eram dois itens vagos; agora
  são um só ("Vida do mascote") com critério de aceite.
