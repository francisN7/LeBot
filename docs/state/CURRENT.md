# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter ≤60 linhas.
> `Retorno:` é o hash do commit em que a próxima sessão começa.

## Sessão

- **Última concluída:** S14b — análise de desempenho (2026-11-26).
- **Próxima:** S14c — leveza I (`docs/sessions/S14c-leveza-animacao.md`).
- **Ciclo:** pós-MVP em `docs/roadmap/main.md` (Fase 14); MVP em `0001-mvp.md`.
- **Retorno:** `d0394cd` — S14a: code tour, convencoes e npm run code:report.

## Pronto

- MVP completo e `v0.2.1` no GitHub Releases (APK assinado, arm64 + armv7).
- Docs por tipo (ADR 0028) com `npm run docs:check` no CI; README com telas
  fictícias (`docs/assets/screenshots/`).
- Backlog auditado e priorizado com o dono em `docs/roadmap/main.md`.
- Release só por `workflow_dispatch` (campo `tag` publica); tag não rebuilda
  (adendo na ADR 0026). Medição: `bash scripts/measure-gfx.sh --help`.
- Tour, convenções e linha de base do `code:report`: `docs/guide/code-tour.md`.
- Desempenho e orçamento: `docs/reference/performance.md` + ADR 0029 (stack fica).

## Próximo passo

Abrir a S14c: medidores em `scripts/`, depois pausa fora de foco e loops com fim.

## Decisões abertas

- Nenhuma.

## Arquivos-chave

- `.github/workflows/release.yml` — build, conferência e publicação do APK.
- `docs/guide/release.md` — passo a passo e versões publicadas.
- `docs/guide/code-tour.md` — tour, convenções e linha de base do código.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- `v0.2.1` medido na S14b é o asset `e44b2c…3ab6` (build `2d66d62`).
- `expo install` com `app.config.ts` dinâmico não grava plugins e pode pôr
  `jest-expo` em `dependencies`: conferir à mão (ocorreu na S13f).
- `expo` 58.1.0 + plugins novos ainda não rodaram em aparelho.
- Backups **reais** só no celular/nuvem, nunca aqui. Restaurar fixture apaga o
  acervo real: pedir backup ao dono. Fixture não tem capa (só lombadas).
- Husky só dá `+x` ao criar: hook sem permissão → `rm -rf .husky/_ && npx husky`.
- Node 26 / npm 12: o npm bloqueia scripts de instalação (`allowScripts`); a
  suíte passa assim. Timeout de 5 s no Jest = RAM curta (5,6 GB aqui): rodar
  `npx jest --maxWorkers=4` antes de investigar (S14a: 517/517 assim).
- Há 26 imports profundos entre features (ver tour): não criar novos.
- Social preview (`docs/assets/social-preview.png`): subir à mão em Settings.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test && npm run docs:check
npm run doctor
```
