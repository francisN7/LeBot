# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Uma entrada por **versão**; o detalhe por sessão está em
[`docs/roadmap/0001-mvp.md`](docs/roadmap/0001-mvp.md) e as decisões em
`docs/adr/`.

## Não publicado — S13 (documentação e vitrine)

### Added

- README com logo, badges, seis telas de acervo fictício e resumo em inglês.
- `scripts/build-demo-backup.mjs` gera o fixture de demonstração
  (`lebot-demo.zip`, fora do Git).
- `docs/assets/` com logo, screenshots e social preview.

### Changed

- Docs vivos separados em `guide/` e `reference/`, com mapa por seção e
  `npm run docs:check` no CI (links + orçamento).
- As 23 specs antigas saíram do working tree; o MVP virou
  [`docs/roadmap/0001-mvp.md`](docs/roadmap/0001-mvp.md) e o `CHANGELOG`, uma
  entrada por versão.
- **Backlog auditado com o dono em `docs/roadmap/main.md`:** sync, Goodreads,
  IA, audiobook, OCR, widget e compartilhar resenhas saíram; a busca por ISBN
  entrou no lugar do OCR.
- Índice dos 27 ADRs em [`docs/adr/README.md`](docs/adr/README.md).
- Repositório auditado: `.gitignore`, GitHub (topics, Issues/Wiki, Dependabot
  security updates) e caminhos pessoais fora dos scripts.
- Notas de release movidas para `docs/releases/`.

## v0.2.1 — Estante animada e Ordem paginada (a publicar)

### Added

- Fixture de 200 livros (`scripts/build-200-books.mjs`) e protocolo de medição
  (`scripts/measure-gfx.ps1`).

### Changed

- Estante com 200 livros: 71,5% → ~5% de frames janky e mediana 53 → 18–19 ms,
  sem tirar a animação.
- Ordem em páginas de 10, com Anterior/Próxima; o ANR de 200 livros acabou.
- Versão 0.2.1 (`versionCode` 2), instalada por cima da 0.2.0 com os dados
  preservados.

### Fixed

- Abrir a Ordem com 200 livros travava a thread de JS.

## v0.2.0 — Primeira versão

### Added

- APK assinado (arm64 + armv7), instalável fora do Expo Go.
- Estante com lombadas 3D por gênero/status, capa real, busca sem acento e
  filtros.
- Hoje com plano diário calculado offline; Ordem persistida e reordenável.
- Registro de leitura, conclusão com resenha, "Meu ritmo" e backup `.zip`.
- Ajustes com meta diária, gêneros personalizados e campos de resenha.

## MVP — S0 a S12b (pré-0.2.0)

- Fundação Expo + TypeScript + Expo Router, design system NativeWind, SQLite com
  Drizzle e migrações versionadas.
- Biblioteca com ISBN oficial, capas e gêneros editáveis; identidade vetorial
  (lombada, mascote, ícone e splash).
- Motor do plano determinístico (meta 3–200, volta leve, principal, teto e
  alternância de gênero) e tela Hoje.
- Ordem automática, troca rápida de status, resenha, estatísticas por período
  civil e backup manual.
- 517 testes, CI com lint/tipos/testes/gitleaks/expo-doctor e build de release
  no GitHub Actions.

As notas de cada versão ficam em `docs/releases/`.
