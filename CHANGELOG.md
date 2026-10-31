# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

### Added

- App Expo SDK 58 com Expo Router em `src/app/`, TypeScript strict e tela
  inicial da S0.
- `app.config.ts` com identidade `LêBot` (slug/scheme `lebot`, package
  `com.francis.lebot`).
- Biome (lint + formatação), Jest com `jest-expo` e testes da paleta.
- Husky + lint-staged no pre-commit, com varredura opcional de `gitleaks`.
- CI no GitHub Actions: lint, typecheck, testes, `expo-doctor` e gitleaks no
  histórico completo.
- `LICENSE` MIT (código e arte), `SECURITY.md`, `.gitattributes` e `.nvmrc`.
- Documentação: `README.md`, `docs/architecture.md`,
  `docs/security-privacy.md`, `docs/learn/expo-for-react-devs.md`.
- Scaffolding de contexto entre sessões (`AGENTS.md`, `docs/state/CURRENT.md`,
  `docs/INDEX.md`, `docs/roadmap.md`, specs e ADRs).
- Identidade LêBot documentada (`docs/brand.md`,
  `docs/adr/0002-identidade-lebot.md`).
- Arte-fonte organizada em `brand/source/`.
- Skills globais `session-start` (handoff) e `project-context-init` (estrutura
  em novos projetos).

### Changed

- Commits passam a usar o e-mail `noreply` do GitHub; commit inicial reescrito
  e republicado.
- Dependabot deixa de abrir PRs de versão; só alertas de segurança
  (`docs/adr/0005-sem-dependabot-de-versao.md`).
