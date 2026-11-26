# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter ≤60 linhas.
> `Retorno:` é o hash do commit em que a próxima sessão começa.

## Sessão

- **Última concluída:** S13e — `v0.2.1` publicado (2026-11-04).
- **Próxima:** S14a — code tour, convenções e code report
  (`docs/sessions/S14a-code-tour.md`).
- **Ciclo:** pós-MVP ativo em `docs/roadmap/main.md` (Fase 14); MVP fechado
  em `docs/roadmap/0001-mvp.md`.
- **Retorno:** `c83b4c0` — S13e: protege o APK medido contra o rebuild da tag.

## Pronto

- MVP completo e `v0.2.1` no GitHub Releases (APK assinado, arm64 + armv7).
- Docs por tipo (ADR 0028): mapa, `guide/`, `reference/`, ADRs, notas em
  `docs/releases/`; `npm run docs:check` no CI.
- README com logo, badges e seis telas fictícias (`docs/assets/screenshots/`).
- Backlog auditado e priorizado com o dono em `docs/roadmap/main.md`.

## Próximo passo

Deixar o CI verde (`npx expo install --fix`, item de Manutenção do roadmap) e
abrir a S14a.

## Decisões abertas

- A manutenção (CI, `release.yml`, `measure-gfx`) entra antes da S14a ou depois?

## Arquivos-chave

- `.github/workflows/release.yml` — build, conferência e publicação do APK.
- `docs/guide/release.md` — passo a passo e versões publicadas.
- `scripts/build-demo-backup.mjs` — gera o `lebot-demo.zip` fictício (fora do Git).

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- Asset do `v0.2.1` (`e44b2c…3ab6`, build `2d66d62`) foi recompilado pela tag;
  o APK medido era `1D4AE0…D838` (build `e6738dd`, mesmo código). Falta remedir.
- **CI vermelho no Expo Doctor:** 10 pacotes do SDK 58 com patch novo (lint,
  tipos, testes e docs passam).
- Os backups **reais** ficam só no celular/nuvem, nunca nesta máquina nem no
  repo. O aparelho ficou com o fixture de 200 livros; o acervo volta por Ajustes
  → Backup.
- Hooks do Husky (`.husky/_/*`) sem permissão de execução: rode `npx husky`.
- Node 26 / npm 12: o npm bloqueia scripts de instalação (`allowScripts`); a
  suíte passa assim. A primeira rodada do Jest sem cache pode estourar timeout.
- Social preview (`docs/assets/social-preview.png`) ainda não subiu: é manual em
  Settings → Social preview.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test && npm run docs:check
npm run doctor
```
