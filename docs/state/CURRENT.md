# Estado atual

## Sessão

- **Atual:** nenhuma; S11c concluída em 2026-11-01 (implementação).
- **Última concluída:** S11c — Estante em camadas e grade virtualizada. O corpo
  da lombada ficou estático; brilho, piscada, “zzz” e tassel viraram camadas
  pequenas; a grade virou `FlatList` virtualizada (ADR 0024).
- **Próxima:** S12 — release interno. Antes do commit final, medir UI/JS no
  aparelho com 5 livros e com estante cheia; o número de aceite é no APK.

## Pronto (S11c)

- Baseline registrado em dev com 5 livros: **UI 11 fps / JS 56 fps**.
- `SpineArtwork`: corpo/faixas/nervuras num `Svg` estático; brilho numa `View`
  recortada com `translateX`; piscada em overlay de opacidade; “zzz” em `Svg`
  próprio (opacidade); tassel em três `Animated.View` recortadas com `rotate` e
  `transformOrigin` (corda/cabeça e sombra em (6,0), franja em (6,9)).
- Corda começa em `y=2.1`, sem `bodyClip`; sombra em `RadialGradient`; sem
  `FeGaussianBlur` no caminho animado. Modelo C do balanço intacto.
- `Spine` memoiza `resolveSpineArt`; `SpineArtwork` é `memo`.
- `EstanteScreen`: `FlatList numColumns={2}` com header (título, contagem, “Meu
  ritmo”, busca e filtros) e vazio em `ListHeaderComponent`/`ListEmptyComponent`;
  `initialNumToRender` 6, lote 8, `windowSize` 5, `removeClippedSubviews`.
  `visibleBooks` memoizado; entrada anima só a primeira leva.
- A lista inteira continua em memória (busca/filtros/contagem/ordem). Milhares de
  livros são suportados; paginar o repositório é o próximo passo se passar de
  dezenas de milhares.
- 511 testes em 66 arquivos; ADR 0024 e docs de design/testing atualizados.

## Decisões abertas

- **Medição:** confirmar 60 fps no aparelho (dev e APK da S12). Se ainda cair,
  a próxima alavanca é `renderToHardwareTextureAndroid`/`shouldRasterizeIOS`,
  conferindo memória.
- S12: decidir build local (prebuild + Gradle) × EAS antes do APK.
- Backlog: galeria de citações, `finished_at`, grid ajustável, animações do
  mascote, `useReducedMotion`, tema escuro e temas extras.

## Arquivos-chave

- `src/components/ui/SpineArtwork.tsx`, `SpineFace.tsx`, `Spine.tsx`,
  `BookCover.tsx`, `BookArt.tsx`
- `src/features/library/EstanteScreen.tsx` (+ teste), `spine-art.ts`,
  `spine-label.ts`
- `src/theme/sizes.ts`, `src/theme/shadows.ts`
- `docs/adr/0024-lombada-em-camadas-e-grade-virtualizada.md`,
  `docs/adr/0023-animacao-do-tassel.md`
- `docs/design/assets-3d.md`, `docs/design/design-system.md`, `docs/testing.md`
- `docs/sessions/S11c-estante-performance.md`, `docs/sessions/S12-release-interno.md`

## Armadilhas

- **Tassel:** a camada é recortada em `viewBox="-4 0 16 28"`; a origem do giro é
  local (`10/64` da largura), não `6/64`. O recorte precisa da folga de −4 para a
  franja não cortar quando inclina. `FeGaussianBlur` saiu; sombra é radial.
- **Corda:** começa em `y=2.1`; não volte a pôr `bodyClip` nem `y=0` — o topo
  descola no pico.
- **Cabeçalho da lista:** é um elemento React em `ListHeaderComponent` (mesmo
  tipo a cada render, para a busca não perder foco). Por isso
  `JSON.stringify(screen.toJSON())` fica circular; nos testes, percorra
  `children`/`props.gradient`.
- **Virtualização:** só a primeira leva monta. Não afirme um card distante sem
  buscar/filtrar; não simule frames.
- A etiqueta é uma View fora da árvore de acessibilidade; em teste use
  `{ includeHiddenElements: true }`. O `Pressable` da arte é transparente.
- A capa S2 é sombra sobre a foto; não volte ao bloco de páginas.

## Como rodar

```bash
npm run lint && npm run typecheck && npm run test
npm run doctor
npx expo export --platform android --output-dir dist
```
