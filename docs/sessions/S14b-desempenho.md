# S14b — Análise de desempenho (A1)

## Objetivo

Saber, com números do APK de release, por que o LêBot parece pesado e decidir o
caminho para deixá-lo leve: um relatório com medições, causas, caminhos
comparados e itens novos no backlog.

## Fora de escopo

- Qualquer mudança de código do app (otimização, troca de lib, refactor).
- Medir no Expo Go ou em build de dev (exagera; `gfxinfo` não vale).
- Vida e animação nova (é a S14c, que usa o orçamento desta).

## Tarefas

1. **Protocolo:** fixar aparelho, APK (hash e build do `v0.2.1` ou um novo
   `workflow_dispatch` sem `tag`), acervo (fixture de 200 livros) e número de
   repetições. Registrar no relatório antes de medir.
2. **Medir** no APK de release: boot frio até a Estante, troca entre as quatro
   abas, rolagem e roda de status na Estante (`bash scripts/measure-gfx.sh`),
   memória (`dumpsys meminfo`) e tamanho do APK por ABI.
3. **Causas:** cruzar as medições com o `npm run code:report` (arquivos maiores,
   `SpineArtwork`, `Mascot`), dependências nativas e o que roda no boot
   (`src/app/_layout.tsx`). Hipótese só entra com evidência.
4. **Caminhos:** comparar ao menos três (ajuste dentro do stack atual; troca de
   peças, ex. lista/animação/SVG; mudança de framework ou linguagem), com
   ganho esperado, custo e risco. Nada é intocável.
5. **Decidir com o dono:** se mudar a direção, ADR novo.
6. **Backlog:** itens com custo e aceite em `docs/roadmap/main.md`; rever a
   ordem da S14d em diante se a arquitetura mudar.

## Aceite

- [ ] Relatório em `docs/reference/performance.md` (ou onde o mapa indicar)
  com protocolo, medições, causas e caminhos; linkado em `docs/README.md`.
- [ ] Medições do APK de release em aparelho real, com hash do APK.
- [ ] Decisão registrada (ADR se mudar a direção) e itens novos no backlog.
- [ ] Zero mudança de comportamento no app; `docs:check` verde.
- [ ] Commit `S14b: ...`.

## Orçamento de contexto (≤400 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, a saída do `npm run code:report`,
`docs/guide/release.md` → **Medir** e `docs/guide/setup.md` (tabela de
scripts). Código só por `grep`/cabeçalho nos suspeitos que a medição apontar.

## Arquivos prováveis

`docs/reference/performance.md`, `docs/README.md`, `docs/roadmap/main.md`,
`docs/adr/` (se houver decisão), `scripts/measure-gfx.sh` (só uso).

## Riscos

- **Sem aparelho ou `adb`:** a sessão para no protocolo; não medir no Expo Go.
- **APK errado:** o asset do `v0.2.1` foi recompilado pela tag; anotar o hash.
- **Otimizar no meio:** esta sessão só mede e decide.
- **Conclusão sem número:** toda causa aponta para uma medição.

## Próximo depois desta

S14c — análise de vida (A2), dentro do orçamento de desempenho definido aqui.
