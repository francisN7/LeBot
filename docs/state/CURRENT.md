# Estado atual

## Sessão

- **Atual:** nenhuma; S11b concluída em 2026-11-01.
- **Última concluída:** S11b — tassel C animado com `matrix` no `G`, conferido no
  Android (no lab, `rotation` ficou parado e `matrix`/View animaram). A corda é
  cortada pela silhueta do corpo para não soltar do topo.
- **Próxima:** S12 — release interno, spec em
  `docs/sessions/S12-release-interno.md`.

## Pronto (S11b)

- Modelo **C** aprovado e implementado: ataque de ~400 ms até 10°, hesitação,
  franja a 12,5° ~90 ms depois, sombra a 55%, overshoot de 1,6° e ciclo de 4,4 s.
  Mesma amplitude no cheio (64) e no compacto (52).
- `SpineArtwork` anima `matrix` (prop nativa) no corpo, na cabeça, na franja e na
  sombra; `rotation`/`origin` animados eram descartados pelo Android. A franja
  gira em torno de (6, 9) e pode cruzar a borda; a corda usa `bodyClip`.
- Pesquisa e diagnóstico em `.temp/s11b-tassel/pesquisa.md` (fora do git); os
  modelos animados ficam em `.temp/s11b-tassel/modelos.html`.
- 510 testes em 66 arquivos; lint, typecheck, test, doctor e export verdes.
  ADR 0023.

## Pronto (S11a)

- Lombada B, etiqueta, tassel T1 e capa S2 aprovados; ADR 0022. Detalhes na
  spec e no histórico.

## Decisões abertas

- S12: decidir build local (prebuild + Gradle) × EAS antes do APK.
- Backlog: galeria de citações, `finished_at`, grid ajustável, animações do
  mascote, `useReducedMotion`, tema escuro e temas extras.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/spine-art.ts`, `spine-label.ts` (+ testes),
  `BookFormScreen.tsx`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `src/features/stats/FinishedStrip.tsx`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, ADR 0022/0023
- `docs/sessions/S11a-design-3d-emocoes.md`,
  `docs/sessions/S11b-tassel-animado.md`, `docs/sessions/S12-release-interno.md`
- `.temp/s11b-tassel/` (`pesquisa.md`, `modelos.html`; ignorado)

## Armadilhas

- **Tassel:** `rotation`/`origin`/`translateY` animados no `G` viram `matrix` só
  no render; o nativo não os aceita. Anime `matrix` (ADR 0023) ou use
  `Animated.View`. O “zzz” só anima opacidade.
- A corda precisa do clip **fixo** na silhueta do corpo (`bodyClip`); um clip
  dentro do grupo animado gira junto e não corta. A franja fica fora do clip.
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
- `.temp/` está no `.gitignore`; guarda a pesquisa e os modelos da S11b.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
