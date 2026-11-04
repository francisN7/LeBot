# Estado atual

## Sessão

- **Última concluída:** S13c — arquivo, roadmap e backlog (2026-11-04).
- **Fase aberta:** S13 — documentação e vitrine, com o release no fim.
- **Próxima:** S13d — README, screenshots e logo
  (`docs/sessions/S13d-readme-screenshots.md`).
- **Depois:** S13e — publicar o `v0.2.1`.
- **Retorno:** tag `pre-s13` em `7da3c88`.

## Documentação

- Mapa em `docs/README.md`. Guias em `docs/guide/`, referência em
  `docs/reference/`, decisões em `docs/adr/`, notas em `docs/releases/`.
- Orçamento: mapa + guide + reference ≤1.300 linhas; `AGENTS` ≤100;
  `CURRENT` ≤60; spec ≤90. `npm run docs:check` (links + orçamento) roda no CI.
- Pendente na S13d: README com logo, screenshots fictícios e social preview.
- Backlog auditado e priorizado em `docs/roadmap/main.md` (ordem fechada com o
  dono; ideias descartadas registradas).

## APK 0.2.1

- Cópia única local: `%USERPROFILE%\Apps\Codes\lebot-artifacts\lebot-0.2.1.apk`.
- SHA-256 `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
- Instalado por cima do 0.2.0, dados preservados. O Release não foi publicado.
- Depois da S13e sobra só o asset do GitHub; a cópia local e o artefato do
  Actions são apagados.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- `backups/` tem 2 backups **reais**: nunca commitar, nunca apagar.
- Screenshots (S13d) só com o acervo fictício; exportar o real antes e restaurar
  depois.
- Nunca editar Markdown com PowerShell (`Get-Content -Raw` + `Set-Content`
  corrompe acento); usar o editor.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test && npm run docs:check
npm run doctor
gh workflow run release.yml
```
