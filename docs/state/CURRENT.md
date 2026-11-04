# Estado atual

## Sessão

- **Última concluída:** S13a — higiene e auditoria do repositório
  (2026-11-04).
- **Fase aberta:** S13 — documentação e vitrine, em cinco sub-sessões, **com o
  release no fim** (decisão do dono em 04/11/2026).
- **Próxima:** S13b — mapa e poda dos docs vivos
  (`docs/sessions/S13b-mapa-e-poda-docs.md`).
- **Depois:** S13c (arquivo/roadmap/backlog), S13d (README/screenshots) e S13e
  (publicar o `v0.2.1`).
- **Retorno:** tag `pre-s13` em `7da3c88`.

## Auditoria da S13a (2026-11-04)

- Sem segredo no HEAD nem no histórico (gitleaks do CI + varredura manual);
  nenhum `.env`, keystore, banco ou backup já versionado. Segredos só nos
  Secrets do Actions, `GITHUB_TOKEN` read-only e actions pinadas por SHA.
- GitHub: secret scanning e push protection ligados; Dependabot security
  updates ligado; topics definidos; Issues e Wiki desligados.
- Caminhos pessoais removidos de `scripts/measure-gfx.ps1` e do comentário do
  plugin de assinatura; `package.json` ganhou licença e repositório.
- `.gitignore`: `lebot-*.zip` cobre fixture/demo/backup e ferramentas locais
  estão cobertas. 12,4 MB de gerados removidos; `backups/` intacto.
- Release `v0.2.0`: nome do asset corrigido no corpo (`lebot-0.2.0.apk`).
- Pendente: nota de marca no README (S13d).

## Resultado medido (Realme C67, Android 15, `dumpsys gfxinfo`, 6 flings)

| Cenário | 0.2.0 | 0.2.1 |
|---|---|---|
| 200 livros, rodada 2 | 71,5% janky · 53 ms | 5,3% · 19 ms |
| 200 livros, rodada 1 | 68,4% · 53 ms | 6,7% · 18 ms |
| 3 livros | 4,4% · 20 ms | 2,5–3,0% · 14–16 ms |

Abertura a frio: 1,7–2,1 s. Sem tirar a animação; mediana ~10x menor.

## Entrega da S12b

- `useShelfAnimations`: só os cards visíveis animam; loops pausados entre
  `onScrollBeginDrag` e `onMomentumScrollEnd` (timers de 300 ms / 2,5 s).
- `Spine`/`SpineArtwork`/`useBlink` com `animating`; a arte pausada continua
  montada (corpo, rosto e tassel no lugar).
- Ordem com `QUEUE_PAGE_SIZE = 10`: Anterior/Próxima, arrasto preso à página,
  setas atravessam páginas e a tela acompanha o livro. O ANR de 200 livros
  acabou (só a 1ª abertura paga ~2 s de aquecimento).
- `scripts/build-200-books.mjs` (fixture UTF-8 validada pelo app) e
  `scripts/measure-gfx.ps1` (protocolo repetível de medição).
- ADR 0027 (+ adendo da Ordem); `docs/release-notes-v0.2.1.md` pronto, sem H1.
- Versão `0.2.1`, `versionCode: 2`; Actions limpo (82 artefatos removidos,
  caches 5,36 → 1,59 GB; procedimento em `docs/release.md`).

## Onde está o APK

- Artefato `lebot-apk` do run `41766015381` (expira em 30 dias) e cópia
  durável em `%USERPROFILE%\Apps\Codes\lebot-artifacts\lebot-0.2.1.apk`.
  A cópia local sai depois do Release (S13e); o asset publicado é a única.
- SHA-256 `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
- Instalado por cima do 0.2.0 (`versionCode` 2), dados preservados. **O Release
  não foi publicado**: sai na S13e, com as docs fechadas.

## Próximo passo (S13b → S13e)

1. **S13b:** mapa e poda dos docs vivos; `docs:check` no CI.
2. **S13c:** arquivo das specs, roadmap por fases e backlog priorizado.
3. **S13d:** README, screenshots com acervo fictício e logo.
4. **S13e:** publicar o `v0.2.1` com o APK medido, sem rebuild.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- `adb shell input tap` usa px de 1080×2400; a imagem no chat é 900×2000 (×1,2).
- Custo da Ordem era montar ~172 `QueueRow`; `sync()` custa ~70 ms.
- Fixture em `/sdcard/Download/lebot-200.zip`; o acervo real fica na pasta
  `LêBot/` do aparelho (Ajustes → Backup restaura).
- Artefato do Actions expira em 30 dias; a cópia durável em
  `lebot-artifacts\` é a fonte. Se o build tiver de ser refeito, que seja no
  commit `7da3c88` e com medição curta antes de publicar.
- `backups/` tem 2 backups **reais** (2,4 MB): nunca commitar, nunca apagar.
- Sessões usam dados fictícios em screenshots (S13d); o acervo real volta depois.
- Nunca editar Markdown com PowerShell (`Get-Content -Raw` + `Set-Content`
  corrompe acento); usar o editor.

## Arquivos-chave

`src/features/library/use-shelf-animations.ts`,
`src/components/ui/{spine,SpineArtwork,SpineFace}.tsx`,
`src/features/queue/QueueScreen.tsx`, `scripts/build-200-books.mjs`,
`scripts/measure-gfx.ps1`, `docs/adr/0027-estante-em-memoria-e-blocos.md`,
`docs/release-notes-v0.2.1.md`.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
node scripts/build-200-books.mjs
powershell -File scripts/measure-gfx.ps1 -Label depois -Rounds 3
gh workflow run release.yml
```
