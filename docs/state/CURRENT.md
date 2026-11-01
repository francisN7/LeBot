# Estado atual

## Sessão

- **Atual:** S11b em andamento — C aprovado e implementado; falta conferir no
  Android se o tassel balança (`matrix`) e fechar a sessão.
- **Última concluída:** S11a (lombada B + etiqueta + capa S2), conferida no
  Android; o tassel **não animou**.
- **Próxima:** conferir no aparelho; se `matrix` não animar, trocar por
  `Animated.View` (lab). Depois S12 (release interno).

## Pronto (S11b, parcial)

- Pesquisa (6 referências) e diagnóstico do `AnimatedG` em
  `.temp/s11b-tassel/pesquisa.md` (fora do git): `rotation`/`origin` animados
  no `G` são descartados; `matrix` é prop nativa.
- **C aprovado e implementado:** ataque ~400 ms até 10°, hesitação, franja 12,5°
  ~90 ms depois, sombra 55%, ciclo de 4,4 s e mesma amplitude no compacto.
  `SpineArtwork` anima `matrix` no corpo/franja/sombra e clipa a corda na
  silhueta (`bodyClip`) para não descolar do topo. Modelos em
  `.temp/s11b-tassel/modelos.html`.
- **Lab:** `src/app/dev-tassel.tsx`, com atalho `__DEV__` em Ajustes; apagar os
  dois no fim da sessão.

## Pronto (S11a)

- Lombada B, etiqueta, tassel T1 e capa S2 aprovados; ADR 0022. Detalhes na
  spec e no histórico.

## Decisões abertas

- **S11b:** confirmar no Android que `matrix` anima; se não, View + SVG.
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
- `src/app/dev-tassel.tsx` (lab) e o atalho em `src/app/(tabs)/ajustes.tsx`

## Armadilhas

- **Tassel:** `rotation`/`origin` do `G` viram `matrix` só no render;
  `animatedProps` não passam por ali. A implementação anima `matrix` (prop
  nativa); confirmar no Android. O `translateY` do “zzz” também é ignorado.
- A corda é clipada na silhueta do corpo (`bodyClip`); sem isso ela flutua sobre
  o canto arredondado quando o tassel inclina. A franja pode passar da borda.
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
  `src/app/dev-tassel.tsx` e o atalho em Ajustes são temporários.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```

Lab da S11b: em Ajustes, toque em **Lab do tassel** (só em dev).
