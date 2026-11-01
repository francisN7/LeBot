# Estado atual

## Sessão

- **Atual:** S11b em andamento — modelos prontos; falta o dono aprovar um e rodar
  o lab no Android.
- **Última concluída:** S11a (lombada B + etiqueta + capa S2), conferida no
  Android; o tassel **não animou**.
- **Próxima:** implementar o modelo aprovado com a técnica que animar; depois
  S12 (release interno).

## Pronto (S11b, parcial)

- Pesquisa (6 referências) e princípios para 64/52 px em
  `.temp/s11b-tassel/pesquisa.md` (fora do git).
- **Diagnóstico:** `rotation`/`origin` animados no `G` são descartados;
  detalhe em Armadilhas.
- **3 modelos animados** em `.temp/s11b-tassel/modelos.html`: A brisa (−4,5°),
  B follow-through (−7°, franja −9,5°) e C rajada (−10°), em 3 gêneros × 64/52.
- **Lab temporário** `src/app/dev-tassel.tsx`: G+rotation (atual), G+matrix e
  View+SVG do tassel. Lint e typecheck verdes.

## Pronto (S11a)

- Lombada **B** 64×128 (52×104), capa 88×128 (72×104), mini-lombada 30×60;
  etiqueta centralizada (11–53 × 19–38, `fitSpineTitle` 7→5), tassel T1 sem
  argola, capa **S2** com sombra sobre a foto e rosto com “zzz” diagonal.
  `SpinePalette` sem `side`/`accent`; ADR 0022.
- 510 testes em 66 arquivos; lint, typecheck, test, doctor e export verdes.

## Decisões abertas

- **S11b:** aprovar A, B ou C (ou ajustar amplitude/ritmo); no Android, dizer
  qual técnica do lab anima. Se `matrix` animar, fica; senão, View + SVG.
- Compacto: manter a amplitude ×0,85 dos modelos ou igualar ao cheio.
- S12: decidir build local (prebuild + Gradle) × EAS antes do APK.
- Backlog: galeria de citações, `finished_at`, grid ajustável, animações do
  mascote, tema escuro e temas extras.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts`, `spine-label.ts` (+ testes),
  `BookFormScreen.tsx`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, ADR 0022
- `docs/sessions/S11a-design-3d-emocoes.md`,
  `docs/sessions/S11b-tassel-animado.md`, `docs/sessions/S12-release-interno.md`
- `.temp/s11b-tassel/` (`pesquisa.md`, `modelos.html`; ignorado)
- `src/app/dev-tassel.tsx` (lab da S11b; **apagar no fim da sessão**)

## Armadilhas

- **Tassel:** `rotation`/`origin` do `G` viram `matrix` só no render;
  `animatedProps` não passam por ali. Animar `matrix` ou usar `Animated.View`.
  O `translateY` do “zzz” também é ignorado; só o `opacity` vale.
- O `Pressable` da arte é transparente; o fundo na cor do gênero virava um
  retângulo nos cantos. Não volte a preencher o fundo.
- A etiqueta é uma View, fora da árvore de acessibilidade (o `Pressable` anuncia
  “Lombada de …”); em teste, use `{ includeHiddenElements: true }`. Título:
  11–53 × 19–38, `fitSpineTitle` (7→5), ellipsis; `showLabel={false}` só na mini.
- O tassel não tem argola; a corda começa em y=0, cortada pelo topo. A sombra é
  um `Ellipse` desfocado; não volte ao contorno navy de “sticker”. O viewBox é
  64×128 (olhos em y=80, boca em 92); a mini-lombada 30×60 mantém 1:2.
- A capa S2 é sombra sobre a foto; não volte ao bloco de páginas/faixa lateral.
  O selo usa `viewBox="14 70 36 32"`.
- `.temp/` está no `.gitignore`; agora guarda os modelos da S11b. O lab
  `src/app/dev-tassel.tsx` é temporário e sai antes do commit final.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```

Lab da S11b: `npm run start` e abrir a rota `/dev-tassel`.
