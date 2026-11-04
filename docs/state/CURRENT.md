# Estado atual

## Sessão

- **Última concluída:** S13e — `v0.2.1` publicado (2026-11-04).
- **Fase 13 concluída; MVP fechado.** Histórico em `docs/roadmap/0001-mvp.md`.
- **Próxima:** S14a — code tour, convenções e code report
  (`docs/sessions/S14a-code-tour.md`).
- **Depois:** Fase 15 — busca por ISBN.
- **Retorno:** tag `pre-s13` em `7da3c88`.

## Documentação

- Mapa em `docs/README.md`. Guias em `docs/guide/`, referência em
  `docs/reference/`, decisões em `docs/adr/`, notas em `docs/releases/`.
- Modelo e orçamento registrados na ADR 0028; as specs da fase saíram do working
  tree e só a S14a (mais o `_TEMPLATE`) fica em `docs/sessions/`.
- Orçamento: mapa + guide + reference ≤1.300 linhas; `AGENTS` ≤100;
  `CURRENT` ≤60; spec ≤90. `npm run docs:check` (links + orçamento) roda no CI.
- README com logo, badges, seis telas em `docs/assets/screenshots/` e resumo em
  inglês; `scripts/build-demo-backup.mjs` gera o acervo fictício.
- Social preview pronto em `docs/assets/social-preview.png`; falta subir em
  Settings → Social preview (o GitHub não expõe isso na API).
- Backlog auditado e priorizado em `docs/roadmap/main.md` (ordem fechada com o
  dono; ideias descartadas registradas).

## Release

- `v0.2.1` publicado em 04/11/2026; asset atual `e44b2c…3ab6` (build `2d66d62`).
- **Incidente:** a tag criada pelo `gh release create` disparou o workflow e o
  rebuild sobrescreveu o APK medido (`1D4AE0…D838`, build `e6738dd`). O código é
  o mesmo; falta remedir o asset atual (aparelho desconectado).
- Guarda no `release.yml` impede novo clobber; a decisão de remover o gatilho de
  tag fica para a próxima sessão.
- Cópia local, `%TEMP%` e artefatos do Actions apagados.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- Os 2 backups **reais** ficam em `%USERPROFILE%\Apps\Codes\lebot-backups\`
  (fora do repo). O aparelho ficou com o fixture de 200 livros; o acervo real
  volta por Ajustes → Backup.
- `lebot-demo.zip` é regenerável (`node scripts/build-demo-backup.mjs`) e fica
  fora do Git.
- Nunca editar Markdown com PowerShell (`Get-Content -Raw` + `Set-Content`
  corrompe acento); usar o editor.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test && npm run docs:check
npm run doctor
gh workflow run release.yml
```
