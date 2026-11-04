# S13b — Mapa e poda dos docs vivos

## Objetivo

Reduzir a documentação viva a **≤1.300 linhas** (mapa + guias + referência),
sem perder nenhuma decisão: o que é história sai, o que é regra fica, e cada
consulta custa uma seção — não um arquivo inteiro.

## Fora de escopo

- Sessões antigas, `CHANGELOG`, ADR e releases (S13c).
- README/vitrine e screenshots (S13d).
- Mudar comportamento do app ou reescrever ADRs.

## Tarefas

1. **Estrutura-alvo:** criar `docs/guide/` e `docs/reference/` e mover com
   `git mv` (o histórico acompanha):
   - `testing.md` → `guide/testing.md`
   - `release.md` → `guide/release.md`
   - `learn/expo-for-react-devs.md` + comandos do `AGENTS` → `guide/setup.md`
   - `architecture.md` → `reference/architecture.md`
   - `data-model.md` → `reference/data-model.md`
   - `design/design-system.md` → `reference/design-system.md`
   - `design/assets-3d.md` + `brand.md` → `reference/brand.md` (um doc só)
   - `planner-algorithm.md` → `reference/planner.md`
   - `security-privacy.md` → `reference/security-privacy.md`
2. **Poda por tipo.** Regra: referência descreve **o que é**; "Cobertura da
   SXX", "histórico" e "pendências" não entram (pendência é backlog ou ADR).

   | Arquivo | Hoje | Meta | Sai |
   |---|---|---|---|
   | `guide/testing.md` | 421 | ~110 | as 14 seções "Cobertura da SXX" |
   | `reference/architecture.md` | 365 | ~160 | lista dos 27 ADRs, "Pendências conhecidas" |
   | `reference/design-system.md` | 495 | ~240 | histórico por sessão, seção "Testes" |
   | `reference/data-model.md` | 285 | ~180 | repetição do que o ADR já explica |
   | `reference/brand.md` | 88+173 | ~170 | duplicação entre os dois arquivos |
   | `reference/planner.md` | 121 | ~110 | nada de regra; só cortar exemplos longos |
   | `guide/release.md` | 165 | ~110 | detalhe de WSL, repetição de comandos |
   | `guide/setup.md` | novo | ~70 | — |
   | `docs/README.md` | novo | ~90 | — |

3. **TL;DR obrigatório:** cada doc vivo abre com 3–5 linhas dizendo o que
   responde e o que **não** responde, com link para o doc certo.
4. **`AGENTS.md` ≤90 linhas:** protocolo de contexto (abrir a seção, não o
   arquivo), comandos reais (`format`, `web`, `build-200-books.mjs`,
   `measure-gfx.ps1`), features completas (`reviews` e `stats` incluídas), DoD.
5. **`CURRENT.md` ≤55 linhas:** só estado — sessão, próximo passo, decisões
   abertas, armadilhas, arquivos-chave. Medições e SHA vão para release/ADR.
6. **`scripts/check-docs.mjs`** (Node puro, sem dependência) + `npm run docs:check`:
   - valida links relativos entre `.md` (ignora `http(s)`, `mailto` e `#âncora`);
   - falha se `AGENTS.md` > 100, `CURRENT.md` > 60 ou spec > 90 linhas;
   - falha se `docs/reference/` tiver heading `Cobertura da S` ou `## SXX`.
   Adicionar o passo ao job `quality` do `ci.yml`.
7. Atualizar as referências em `README.md`, `AGENTS.md`, `docs/README.md` e nas
   specs vivas; rodar `npm run docs:check`, `lint`, `typecheck` e `test`.

## Aceite

- [ ] `mapa + guide/ + reference/` ≤1.300 linhas (sem ADR, releases e specs).
      Meta inicial de 1.250; ajustada na execução porque exigia cortar regra útil.
- [ ] Nenhum "Cobertura da SXX" ou histórico de sessão em doc de referência.
- [ ] Todo doc vivo tem TL;DR e responde uma pergunta só.
- [ ] `AGENTS.md` ≤90 linhas e `CURRENT.md` ≤55.
- [ ] `npm run docs:check` verde, rodando no CI, com links válidos.
- [ ] `lint`, `typecheck` e `test` verdes; commit `S13b: ...`.

## Orçamento de contexto (≤600 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec e os docs que serão podados — **um por
vez**, começando pelo TL;DR e headings. Não abrir `src/` nem `docs/adr/`.

## Arquivos prováveis

`docs/*.md`, `docs/design/*.md`, `docs/learn/*.md`, `AGENTS.md`,
`docs/state/CURRENT.md`, `README.md`, `scripts/check-docs.mjs`, `package.json`,
`.github/workflows/ci.yml`.

## Riscos

- **Cortar decisão junto com história:** se a frase responde "por que assim",
  ela pertence a um ADR; só remover o que é relato de sessão.
- **Link quebrado ao mover:** usar `git mv` e deixar o `check-docs` reprovar
  antes do commit.
- **Sessão grande demais:** se passar de ~2h, dividir em S13b1 (estrutura +
  poda) e S13b2 (AGENTS/CURRENT/check-docs).

## Próximo depois desta

S13c — arquivo, roadmap e backlog.
