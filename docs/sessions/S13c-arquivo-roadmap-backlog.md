# S13c — Arquivo, roadmap e backlog

## Objetivo

Tirar a história do caminho de leitura e deixar o futuro legível: as 25 specs
antigas saem, o MVP vira uma página, o `CHANGELOG` volta a ser de versão e o
roadmap passa a ser um diretório com fases e backlog priorizado.

## Fora de escopo

- Podar os docs vivos (S13b) ou escrever o README (S13d).
- Reescrever ADRs ou apagar decisões: o ADR continua sendo a fonte do "por quê".
- Implementar qualquer item do backlog.

## Tarefas

1. **Arquivo das sessões.** Remover do working tree as specs de S00 a S12b
   (`git rm`); o histórico fica no Git. Ficam `sessions/_TEMPLATE.md` e as specs
   vivas (S13a–S13e).
2. **`docs/roadmap/mvp.md` (1 página).** Tabela S0–S12b: entrega em uma linha +
   critério de aceite em uma linha. Fonte: a tabela atual do `roadmap.md`.
   Fechar com "histórico completo: `git log -- docs/sessions`".
3. **`docs/roadmap/README.md`.** Como o roadmap funciona: fases, status
   (`[ ]`, `[~]`, `[x]`), *definition of ready* (objetivo, aceite, orçamento de
   contexto, riscos), uma sessão = uma entrega + testes + docs + commit.
4. **`docs/roadmap/next.md` (vivo).** Raias **Produto**, **Estante/Dados**,
   **Manutenção** e **Código**; item com uma linha de valor, custo (P/M/G),
   pré-requisito e aceite — máximo 4 linhas. Seção separada de **Gatilhos**
   (ex.: estante em blocos só acima de ~2.000 livros; NativeWind 5 só quando o
   SDK exigir). **Não escrever sem a prioridade do dono:** apresentar a lista
   reescrita e esperar a ordem.
5. **Backlog — decisões de forma.** "Estante em blocos" sai do backlog e vira
   gatilho da ADR 0027; "NativeWind 5" e os advisories do `npm audit` fundem numa
   entrada de manutenção; "frases do mascote" + "refinamento de animações" viram
   "vida do mascote"; temas escuro e paletas viram "temas". Acrescentar
   **acessibilidade** (leitor de tela, contraste, alvo de toque).
6. **`CHANGELOG.md` ≤150 linhas.** Formato Keep a Changelog por **versão**:
   um bloco "MVP (S0–S12b)" com Added/Changed/Fixed agrupados, `0.2.0` e o
   espaço para `0.2.1` (S13e). Detalhe de implementação já vive em ADR.
7. **`docs/adr/README.md`.** Índice dos 27 com uma linha cada e status honesto
   (aceita / substituída por / adendo). Levantar com
   `grep -n "^# \|Status\|substitu" docs/adr/*.md`; abrir por inteiro só os
   ambíguos. Não reescrever ADR.
8. **`docs/releases/`.** Mover `release-notes-v0.2.0.md` e
   `release-notes-v0.2.1.md` para `releases/` e corrigir as referências.
9. **Nomenclatura.** `S3.2` → `S3a` e `S7.1` → `S7a` nos docs vivos e nos nomes
   de arquivo que restarem; ADRs e citações históricas mantêm os nomes antigos.
10. Apagar `docs/roadmap.md` (substituído pelo diretório), atualizar
    `docs/README.md`, `AGENTS.md`, `CURRENT.md` e `README.md`; rodar
    `docs:check`, `lint`, `typecheck` e `test`.

## Aceite

- [ ] Nenhuma spec de S00–S12b no repositório; `mvp.md` cobre S0–S12b.
- [ ] `CHANGELOG.md` ≤150 linhas, por versão, sem detalhe de arquivo.
- [ ] `docs/adr/README.md` com os 27 e status conferido.
- [ ] `next.md` com raias, custos e a prioridade confirmada pelo dono; itens
      descartados fora e gatilhos documentados.
- [ ] `S3.2`/`S7.1` ausentes dos docs vivos.
- [ ] `docs:check`, `lint`, `typecheck` e `test` verdes; commit `S13c: ...`.

## Orçamento de contexto (≤700 linhas)

`AGENTS.md`, `CURRENT.md`, esta spec, `docs/roadmap.md` atual e o `CHANGELOG`.
Para os ADRs, usar `grep` (título + status), não leitura integral. Não abrir
`src/` nem as specs antigas.

## Arquivos prováveis

`docs/sessions/*`, `docs/roadmap.md`, `docs/roadmap/*`, `CHANGELOG.md`,
`docs/adr/README.md`, `docs/releases/*`, `docs/README.md`, `AGENTS.md`,
`docs/state/CURRENT.md`, `README.md`.

## Riscos

- **Apagar spec sem registrar o aceite:** cada linha de `mvp.md` precisa da
  entrega e do critério; o resto continua acessível no Git.
- **Índice de ADR com status inventado:** só marcar "substituída" quando o
  próprio ADR ou o sucessor disser isso.
- **Backlog arbitrário:** sem a lista do dono, a sessão para e pergunta; não
  reordena por conta própria.
- **Changelog perder informação útil:** o que for decisão precisa estar em ADR
  antes de sair; o que for só relato pode ir.
- **Link para `roadmap.md`:** varrer as referências depois de apagar o arquivo.

## Próximo depois desta

S13d — README, screenshots e logo.
