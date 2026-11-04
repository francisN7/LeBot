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
- Orçamento: mapa + guide + reference ≤1.300 linhas; `AGENTS` ≤100;
  `CURRENT` ≤60; spec ≤90. `npm run docs:check` (links + orçamento) roda no CI.
- README com logo, badges, seis telas em `docs/assets/screenshots/` e resumo em
  inglês; `scripts/build-demo-backup.mjs` gera o acervo fictício.
- Social preview pronto em `docs/assets/social-preview.png`; falta subir em
  Settings → Social preview (o GitHub não expõe isso na API).
- Backlog auditado e priorizado em `docs/roadmap/main.md` (ordem fechada com o
  dono; ideias descartadas registradas).

## Release

- `v0.2.1` publicado em 04/11/2026, asset `lebot-0.2.1.apk` (56,6 MB).
- SHA-256 do asset `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`;
  build `e6738dd`.
- Cópia local, `%TEMP%` e artefato do Actions apagados: o Release é a única
  fonte do APK.
- A tag `v0.2.1` aponta para o `main` da documentação; rebuild pela tag exige
  nova medição antes de publicar.

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
