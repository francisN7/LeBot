# Estado atual

## Sessão

- **Última concluída:** S12b — estante animada só no visível + Ordem paginada
  (2026-11-04).
- **Próxima:** S13a — documentação final e limpeza do backlog
  (`docs/sessions/S13a-documentacao-final.md`).
- **Depois:** S13b — publicar o `v0.2.1` com o APK medido aqui
  (`docs/sessions/S13b-publicacao-release.md`).

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

- Artefato `lebot-apk` do run `41766015381` (30 dias) e cópia em
  `%TEMP%\lebot-apk\lebot-0.2.1.apk`.
- SHA-256 `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
- Instalado por cima do 0.2.0 (`versionCode` 2), dados preservados. **O Release
  não foi publicado**: sai na S13b.

## Próximo passo (S13a → S13b)

1. **S13a:** nomenclatura Xa/Xb, backlog pela prioridade do dono, varredura e
   revisão dos docs vivos.
2. **S13b:** `gh release create v0.2.1 --target main --title "LêBot v0.2.1"
   --notes-file docs/release-notes-v0.2.1.md` + upload do mesmo APK.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir** (dev exagera; `gfxinfo` não vale).
- `adb shell input tap` usa px de 1080×2400; a imagem no chat é 900×2000 (×1,2).
- Custo da Ordem era montar ~172 `QueueRow`; `sync()` custa ~70 ms.
- Fixture em `/sdcard/Download/lebot-200.zip`; o acervo real fica na pasta
  `LêBot/` do aparelho (Ajustes → Backup restaura).
- Artefato do Actions expira em 30 dias; se a S13b demorar, rebuildar no mesmo
  commit antes de publicar.
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
