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
- Design system com NativeWind 4.2.7 + Tailwind 3.4 e tokens em `src/theme/`
  (cores, espaçamento, raios, tipografia, tamanhos e opacidade).
- Componentes base `Screen`, `AppText`, `Button`, `Card`, `Chip` e `Spine`,
  com testes de render e interação.
- Shell com 4 abas (`Estante`, `Fila`, `Hoje`, `Ajustes`) e dados fake em
  `src/features/*/__fixtures__/`.
- Fontes Fredoka (600/700) e Nunito (400/600/700) carregadas com `expo-font` e
  splash controlado.
- `docs/design/design-system.md` e ADR
  `docs/adr/0006-design-system-nativewind.md`.
- Shell validado no Expo Go: 4 abas navegam e fontes PT-BR renderizam.

### Changed

- Rotas de `src/app/` só reexportam as telas das features; a tela da S0 virou
  a aba Estante.
- Commits passam a usar o e-mail `noreply` do GitHub; commit inicial reescrito
  e republicado.
- Dependabot deixa de abrir PRs de versão; só alertas de segurança
  (`docs/adr/0005-sem-dependabot-de-versao.md`).

## S2 — Persistência com SQLite + Drizzle

### Added

- Banco local com `expo-sqlite` + `drizzle-orm`, migração
  `drizzle/0000_aspiring_unicorn.sql` e schema tipado em `src/db/schema.ts`
  (`books` e `settings`).
- `src/db/client.ts` com abertura lazy, WAL e `foreign_keys = ON`.
- Migrações no boot (`useMigrations`) com tela de erro `DatabaseError`; seed de
  5 livros fictícios e 4 preferências só em banco vazio.
- Repositórios `books` (list/findById/create/update/remove) e `settings`
  (get/all/set/remove) com validação Zod.
- Hooks `useBooks` e `useSettings` com repositório injetável; Estante, Fila e
  Ajustes passam a ler do SQLite e Hoje lê a meta diária.
- `docs/data-model.md`, `docs/testing.md`, ADR 0007 e ADR 0008.
- Testes de CRUD, constraints, seed idempotente e migração repetida com
  `sql.js`; telas testadas com repositórios em memória (27 testes).

### Changed

- Fixtures de livros e de preferências removidas; `queue` e `daily-plan`
  continuam fictícios até S8 e S6/S7.
- `babel.config.js` usa `babel-plugin-inline-import` e `metro.config.js` inclui
  `sql` em `sourceExts`.

### Fixed

- CI (`Lint, tipos e testes`) falhava no `typecheck` desde `9e650d8`: o arquivo
  gerado `expo-env.d.ts` não existe no runner. `types/expo-types.d.ts` versiona
  a referência a `expo/types` (declaração de `*.css`).
