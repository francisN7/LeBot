# S14a — Code tour, convenções e code report

## Objetivo

Deixar o código navegável por quem chega agora e medir o tamanho do labirinto:
um tour guiado, regras de estrutura e um relatório de arquivos/imports — **sem
mudar comportamento**.

## Fora de escopo

- Refatorar qualquer módulo (isso é a S14b, com o piloto em `backup/format.ts`).
- Mudar telas, regras do plano ou schema.
- Reescrever os docs de referência.

## Tarefas

1. **`docs/code-tour.md`** com ~7 paradas; em cada uma: arquivo, o que olhar e
   por quê. Sugestão de roteiro:
   1. `src/app/_layout.tsx` — boot, fontes, banco, migrações, providers.
   2. `src/theme/` + `src/components/ui/` — tokens e componentes.
   3. `src/db/schema.ts` + `client.ts` — dados e migrações.
   4. Um repositório + hook (`books.ts` + `use-books.tsx`) — fluxo e assinatura.
   5. `src/features/library/EstanteScreen.tsx` — uma feature de ponta a ponta.
   6. `src/features/planner/engine/` — lógica pura e testável.
   7. `src/test-utils/` + um teste de tela — como a suíte segura tudo.
2. **Convenções** (no próprio tour ou em `AGENTS.md`): arquivo ≤250 linhas
   (soft), uma feature = pasta + `index.ts`, import cruzado só pelo `index`,
   comentário explica **por quê** (não o quê), sem `any`.
3. **`scripts/code-report.mjs`** + `npm run code:report`: lista arquivos acima
   de 250 linhas, imports entre features e contagem por pasta; ignora testes,
   gerados e `node_modules`.
4. Rodar o relatório e registrar a **linha de base** (top 10) no tour, para a
   S14b comparar depois.
5. Linkar o tour em `docs/README.md` ("entender o código") e no `AGENTS.md`.
6. `lint`, `typecheck`, `test` e `docs:check` verdes.

## Aceite

- [ ] `code-tour.md` com 7 paradas e links válidos.
- [ ] `npm run code:report` roda e lista top 10 + imports cruzados.
- [ ] Nenhuma mudança de comportamento (só docs e script novo).
- [ ] `docs:check` verde e tour linkado no mapa e no AGENTS.
- [ ] commit `S14a: ...`.

## Orçamento de contexto (≤500 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec e os **cabeçalhos** dos 10 maiores arquivos
do relatório. Não abrir as 22 mil linhas de `src/`.

## Arquivos prováveis

`docs/code-tour.md`, `scripts/code-report.mjs`, `package.json`,
`docs/README.md`, `AGENTS.md`.

## Riscos

- **Tour que envelhece:** citar arquivo e símbolo, nunca número de linha.
- **Refatorar sem querer:** esta sessão só lê e documenta.
- **Relatório barulhento:** excluir `*.test.*`, `drizzle/`, `scripts/` e gerados.
- **Métrica virar meta:** 250 linhas é aviso, não bloqueio; o refactor é a S14b.

## Próximo depois desta

S14b — refactor piloto de `src/features/settings/backup/format.ts` (590 linhas),
separando parse/validate/serialize sem mudar o formato do backup.
