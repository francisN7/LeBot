# S13 — Documentação final e limpeza do backlog

## Objetivo

Fechar a documentação do MVP com uma nomenclatura única de sub-sessões, o
backlog reordenado pela prioridade do dono e sem itens que ele não quer mais —
inclusive nas citações espalhadas fora do backlog.

## Fora de escopo

- Implementar qualquer item do backlog: a S13 decide, remove e reordena.
- Reescrever ADRs ou sessões antigas para reescrever a história; o padrão novo
  vale para os documentos vivos (roadmap, INDEX, CURRENT e specs).

## Decisões a confirmar na abertura

1. **Mapa das sub-sessões.** Proposta: `S3.2` → `S3a`; `S7.1` → `S7a`;
   `S4a`/`S4b`/`S4c` já seguem o padrão. Não há outras sub-sessões no roadmap.
2. **Arquivos de spec acompanham?** Recomendo renomear também
   (`S03.2-generos.md` → `S03a-generos.md`, `S07.1-ajustes-hoje-ordem.md` →
   `S07a-ajustes-hoje-ordem.md`) e atualizar os links, para o roadmap não apontar
   para um nome fora do padrão.
3. **Prioridade do backlog:** o dono define a ordem na abertura; a tabela atual
   é só o ponto de partida.
4. **O que fica como histórico:** menções a nomes antigos em ADRs, sessões já
   entregues e entradas antigas do `CHANGELOG` podem permanecer; promessas vivas
   em docs de referência não.

## Tarefas

1. **Nomenclatura:** aplicar o mapa, decidir sobre os nomes de arquivo, atualizar
   roadmap, `docs/INDEX.md`, `CURRENT.md`, links e `CHANGELOG.md`; varrer com
   `rg` por `S3\.2`, `S7\.1` e variantes para não deixar referência quebrada.
2. **Backlog:** reordenar a seção "Backlog pós-MVP" do `docs/roadmap.md` na
   prioridade definida pelo dono.
3. **Remoção:** apagar do backlog o que o dono não quer mais e remover as
   citações correspondentes nos docs vivos (por exemplo: tema escuro em
   `architecture.md`/`design-system.md`, "(i) de ajuda" no `CURRENT.md`,
   NativeWind 5 na ADR 0006 e no backlog, dependências em `security-privacy.md`
   e README).
4. **Varredura:** para cada item removido, procurar as palavras-chave em
   `docs/`, `README.md`, `AGENTS.md` e `CHANGELOG.md`; separar o que é histórico
   do que ainda promete entrega.
5. Revisar os docs vivos contra o código, fechar o `CHANGELOG.md` e atualizar o
   `CURRENT.md`.
6. **Publicar o v0.2.1** com o APK já medido na S12b (decisão do dono: a tag
   nasce junto com as docs fechadas):
   - o artefato `lebot-apk` do run `41766015381` fica por 30 dias; se expirar,
     `gh workflow run release.yml` antes de publicar;
   - `gh release create v0.2.1 --target main --title "LêBot v0.2.1" --notes-file docs/release-notes-v0.2.1.md`
     e `gh release upload` do **mesmo** APK instalado no aparelho (a tag criada
     pela API não dispara um build novo);
   - conferir o asset no Release e registrar o SHA-256 em `docs/release.md`.

## Aceite

- [ ] Nenhum documento vivo usa `S3.2`/`S7.1`: o padrão é `Xa`, `Xb`, `Ya`,
      `Yb` (roadmap e nomes de spec iguais).
- [ ] Backlog na ordem de prioridade definida pelo dono.
- [ ] Nenhum item descartado aparece como pendência em doc vivo.
- [ ] Links das specs continuam válidos e o INDEX está atualizado.
- [ ] `v0.2.1` publicado com o APK medido na S12b e as notas de
      `docs/release-notes-v0.2.1.md` (sem H1).
- [ ] `lint`, `typecheck` e `test` verdes; commit `S13: ...`.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/roadmap.md`,
`docs/INDEX.md`, `CHANGELOG.md`, `README.md` e os docs de referência citados nas
tarefas.

## Arquivos prováveis

- `docs/roadmap.md`, `docs/INDEX.md`, `docs/state/CURRENT.md`, `CHANGELOG.md`
- `docs/sessions/S03.2-generos.md` e `docs/sessions/S07.1-ajustes-hoje-ordem.md`
- `docs/architecture.md`, `docs/design/design-system.md`,
  `docs/security-privacy.md`, `README.md`, ADR 0006

## Riscos

- **Link quebrado:** renomear arquivo sem atualizar roadmap/INDEX/CURRENT deixa
  doc morto; conferir com `rg` pelo nome antigo e abrir cada link.
- **História reescrita:** trocar nomes em ADRs e sessões antigas confunde o
  registro; só os documentos vivos mudam.
- **Corte por engano:** remover uma citação que ainda é decisão (e não promessa)
  apaga contexto; separar backlog de ADR antes de apagar.
- **Backlog sem dono:** sem a prioridade definida na abertura, a S13 vira uma
  reordenação arbitrária; não começar sem a lista do dono.

## Próximo depois desta

Publicação do `v0.2.1` no Release (mesmo APK medido na S12b) e encerramento do MVP.
