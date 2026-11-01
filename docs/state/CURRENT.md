# Estado atual

## Sessão

- **Atual:** S11a implementada em 2026-11-01; falta **conferir no Android**.
- **Última concluída:** S11 (configurações + backup ZIP), conferida no Android.
- **Próxima:** conferir a S11a no aparelho; depois S12 (release interno), spec em
  `docs/sessions/S12-release-interno.md`.

## Pronto (S11a)

- Lombada sem capa em **52×128** (`spine`) e **42×104** (`spineCompact`); capa
  segue **88×128** (`cover`) e **72×104** (`coverCompact`). `BookArt` escolhe o
  par por `hasCover`; a altura do card não mudou.
- `SpineArtwork` redesenhado no viewBox 52×128: frente em gradiente de quatro
  paradas, face lateral de 5 px (~9,6%), vinco à esquerda, faixas de topo/base
  em diagonal, "z" do sono e tassel na base.
- `SpinePalette` ganhou `side`, `edge`, `light`, `shadow`, `accent` e `gradient`;
  `shade` saiu. O tassel usa `accent` (45% entre base e `ink`) e balança ±2,8°
  em 1,7 s.
- `SpineFace` virou o componente compartilhado da lombada e do selo: piscada só
  em `happy`/`neutral`, mesmo tempo nos dois.
- `BookCover`: bloco de páginas em trapézio de 11% com oito níveis de texto,
  vinco e canto externo curto; o selo foi deslocado para a esquerda da face
  (`right = página + xs`). O preview do formulário recebe `status` e acompanha o
  chip (`testID="preview-capa"`).
- Sombra de contato curta (`contactShadow` em `src/theme/shadows.ts`) no wrapper
  da lombada e da capa.
- `FinishedStrip` usa `Spine` 30×74 para manter a proporção 1:2,46.
- 19 testes novos (505 em 65 arquivos); lint, typecheck, test e export verdes.
  Sem migração. ADR 0022 criada; `docs/release.md` entra na S12.

## Decisões abertas

- Conferir no Android: volume da lateral, tassel no compacto, rosto no selo de
  18–26 px, páginas sobre fotos claras, sombra de contato e alinhamento da grade.
- Backlog: galeria de citações, `finished_at`, grid ajustável na Estante,
  refinamento das animações do mascote, tema escuro e temas extras.
- S12: decidir build local (prebuild + Gradle) × EAS antes de gerar o APK.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts` (+ teste), `BookFormScreen.tsx`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, ADR 0022
- `docs/sessions/S11a-design-3d-emocoes.md`, `docs/sessions/S12-release-interno.md`

## Armadilhas

- O viewBox da lombada é **52×128**; não reaproveite o 100×140 com
  `preserveAspectRatio="none"` — o rosto vira oval.
- O SVG da lombada tem `accessibilityElementsHidden`; em teste, consulte face e
  tassel com `{ includeHiddenElements: true }`.
- O tassel e a face usam `testID` com a expressão (`-face-happy`); não renomeie
  sem ajustar `Spine.test`, `BookCover.test` e `BookFormScreen.test`.
- A piscada vive só em `SpineFace`; não duplique timers na lombada ou no selo.
- `BookCover` assume `sizes.cover`; o padrão antigo era `sizes.spine` (88×128).
- O `FinishedStrip` cresceu 30 px de altura; não confunda com regressão de card.
- A capa ainda usa `radii.md`; a lombada passou a `radii.sm` para acompanhar a
  arte de 52 px.
- O export/backup continua igual à S11; nada de migração nesta sessão.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
