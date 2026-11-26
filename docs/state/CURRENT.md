# Estado atual

> Handoff entre sessões. Atualizar no fim de toda sessão. Manter ≤60 linhas.
> `Retorno:` é o hash do commit em que a próxima sessão começa.

## Sessão

- **Última concluída:** S13f — manutenção: SDK 58 alinhado, release só manual,
  medição em bash (2026-11-26).
- **Próxima:** S14a — code tour, convenções e code report
  (`docs/sessions/S14a-code-tour.md`).
- **Ciclo:** pós-MVP ativo em `docs/roadmap/main.md` (Fase 14); MVP fechado
  em `docs/roadmap/0001-mvp.md`.
- **Retorno:** `241c45e` — docs: coloca a S13f (manutencao) antes da S14a.

## Pronto

- MVP completo e `v0.2.1` no GitHub Releases (APK assinado, arm64 + armv7).
- Docs por tipo (ADR 0028) com `npm run docs:check` no CI; README com telas
  fictícias (`docs/assets/screenshots/`).
- Backlog auditado e priorizado com o dono em `docs/roadmap/main.md`.
- Release só por `workflow_dispatch` (campo `tag` publica); tag não rebuilda
  (adendo na ADR 0026). Medição: `bash scripts/measure-gfx.sh --help`.

## Próximo passo

Conferir o job **Expo Doctor** verde no CI após o push; depois abrir a S14a.

## Decisões abertas

- Nenhuma.

## Arquivos-chave

- `.github/workflows/release.yml` — build, conferência e publicação do APK.
- `docs/guide/release.md` — passo a passo e versões publicadas.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- Asset do `v0.2.1` (`e44b2c…3ab6`, build `2d66d62`) foi recompilado pela tag;
  o APK medido era `1D4AE0…D838` (build `e6738dd`, mesmo código). Falta remedir.
- `expo install` com `app.config.ts` dinâmico não grava plugins e pode pôr
  `jest-expo` em `dependencies`: conferir à mão (ocorreu na S13f).
- `expo` 58.1.0 + plugins novos e `measure-gfx.sh` ainda não rodaram em aparelho.
- Os backups **reais** ficam só no celular/nuvem, nunca nesta máquina nem no
  repo. O aparelho ficou com o fixture de 200 livros; o acervo volta por Ajustes
  → Backup.
- Husky só dá `+x` ao criar: hook sem permissão → `rm -rf .husky/_ && npx husky`.
- Node 26 / npm 12: o npm bloqueia scripts de instalação (`allowScripts`); a
  suíte passa assim. A primeira rodada do Jest sem cache pode estourar timeout.
- Social preview (`docs/assets/social-preview.png`): subir à mão em Settings.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test && npm run docs:check
npm run doctor
```
