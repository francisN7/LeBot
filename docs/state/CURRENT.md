# Estado atual

## Sessão

- **Última concluída:** S12b — estante animada só no visível + Ordem paginada
  (2026-11-04).
- **Próxima:** S13 — documentação final e publicação do `v0.2.1`.
  Spec em `docs/sessions/S13-documentacao-final.md` (tarefa 6).

## Resultado medido (Realme C67, Android 15, `dumpsys gfxinfo`, 6 flings)

| Cenário | 0.2.0 | 0.2.1 |
|---|---|---|
| 200 livros, rodada 2 | 71,5% janky · mediana 53 ms | 5,3% · 19 ms |
| 200 livros, rodada 1 | 68,4% · 53 ms | 6,7% · 18 ms |
| 3 livros (cenário pequeno) | referência 4,4% · 20 ms | 2,5–3,0% · 14–16 ms |

Abertura a frio: 1,7–2,1 s. A meta era ≤ 5% de janky: o build final ficou em
5,3–6,7%, com mediana **18–19 ms** contra 53 ms antes — o ganho é de ~10x no
tempo típico de frame, sem tirar a animação.

## Entrega da S12b

- `useShelfAnimations` (`src/features/library/use-shelf-animations.ts`): conjunto
  visível estável por `useRef`, estado só quando o conjunto muda, pausa entre
  `onScrollBeginDrag` e `onMomentumScrollEnd` com timers de 300 ms / 2,5 s.
- `Spine`/`SpineArtwork`/`useBlink` receberam `animating`; arte parada continua
  montada (corpo, rosto e tassel no lugar).
- Ordem: `QUEUE_PAGE_SIZE = 10` com Anterior/Próxima; arrasto preso à página,
  setas atravessam páginas e a tela acompanha o livro. O ANR de 200 livros
  acabou (primeira abertura paga ~2 s de aquecimento; as seguintes não perdem
  frame).
- `scripts/build-200-books.mjs` (fixture UTF-8, validada pelo `parseBackup` do
  app) e `scripts/measure-gfx.ps1` (protocolo repetível de medição).
- ADR 0027 (estante em memória + plano dos blocos de 200) com adendo da Ordem.
- Versão `0.2.1`, `versionCode: 2`. **Não publicado** — decisão do dono: o
  Release nasce depois da S13, junto com as docs fechadas.
- `docs/release-notes-v0.2.1.md` pronto (sem H1, com as diferenças vs 0.2.0).
- Limpeza do Actions: 82 artefatos removidos (71,7 MB) e caches de
  5,36 GB → 1,59 GB; procedimento em `docs/release.md`.

## Onde está o APK

- Artefato `lebot-apk` do run `41766015381` (30 dias de validade).
- Cópia local: `%TEMP%\lebot-apk\lebot-0.2.1.apk`,
  SHA-256 `1D4AE065C6C76497FABCDAE2595347EF1A8F1492E0CC627948E89183FEADD838`.
- Instalado no aparelho por cima do 0.2.0 (`versionCode` 2, mesma assinatura),
  com os dados preservados.

## Próximo passo (S13)

1. Publicar o `v0.2.1` com **este** APK:
   `gh release create v0.2.1 --target main --title "LêBot v0.2.1" --notes-file docs/release-notes-v0.2.1.md`
   + `gh release upload`.
2. Nomenclatura Xa/Xb, backlog, varredura e revisão dos docs vivos.

## Armadilhas

- Sem build local (ADR 0026). **Expo Go serve para bug funcional, não para
  medir**: modo dev exagera e o `gfxinfo` não vale.
- `adb shell input tap` usa px de **1080×2400**; a imagem que aparece no chat é
  900×2000 (escala 1,2) — conferir antes de clicar.
- Custo da Ordem era montar ~172 `QueueRow`; `sync()` custa ~70 ms.
- Fixture de 200 livros em `/sdcard/Download/lebot-200.zip`; o backup real do
  dono fica em `Franciel/LêBot/` e é restaurado por Ajustes → Backup.
- Artefato do Actions expira em 30 dias; se a S13 demorar, rodar
  `gh workflow run release.yml` de novo antes de publicar.
- Backups e fixtures nunca entram no Git (`backups/`, `lebot-200.zip`).

## Arquivos-chave

- `src/features/library/use-shelf-animations.ts`
- `src/components/ui/spine.tsx`, `SpineArtwork.tsx`, `SpineFace.tsx`
- `src/features/queue/QueueScreen.tsx`
- `scripts/build-200-books.mjs`, `scripts/measure-gfx.ps1`
- `docs/adr/0027-estante-em-memoria-e-blocos.md`,
  `docs/release-notes-v0.2.1.md`, `docs/release.md`

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
node scripts/build-200-books.mjs
powershell -File scripts/measure-gfx.ps1 -Label depois -Rounds 3
gh workflow run release.yml   # APK de release (CI)
```
