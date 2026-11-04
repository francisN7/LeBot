# Estado atual

## Sessão

- **Última concluída:** S13d — README, screenshots e logo (2026-11-04).
- **Fase aberta:** S13 — documentação e vitrine, com o release no fim.
- **Próxima:** S13e — publicar o `v0.2.1`
  (`docs/sessions/S13e-publicar-release.md`).
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

## APK 0.2.1

- Cópia única local: `%USERPROFILE%\Apps\Codes\lebot-artifacts\lebot-0.2.1.apk`.
- SHA-256 `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
- Instalado por cima do 0.2.0, dados preservados. O Release não foi publicado.
- Depois da S13e sobra só o asset do GitHub; a cópia local e o artefato do
  Actions são apagados.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- `backups/` tem 2 backups **reais**: nunca commitar, nunca apagar. O aparelho
  ficou com o fixture de 200 livros; o acervo real volta por Ajustes → Backup.
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
