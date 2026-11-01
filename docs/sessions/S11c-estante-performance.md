# S11c — Estante fluida sem tirar as animações

## Objetivo

Fazer a Estante rodar a 60 fps (ou sem queda perceptível) no Android, mantendo o
balanço do tassel, o brilho que varre a lombada e a piscada, e medir antes e
depois.

## Contexto

- A Estante monta a grade num `View` com `flexWrap` dentro de um `ScrollView`:
  **sem virtualização**. Todas as lombadas visíveis (e as de baixo) montam e
  animam ao mesmo tempo.
- Cada lombada é um `<Svg>` grande: corpo, faixas, nervuras, rosto, brilho e
  tassel. O tassel anima **quatro matrizes** contínuas no mesmo SVG (corpo,
  cabeça, franja e sombra); cada atualização invalida o SVG inteiro. A sombra do
  tassel usa `FeGaussianBlur` **dentro** do grupo animado, então o blur pode ser
  re-rasterizado a cada frame.
- O brilho anima a prop `x` de um `Rect` dentro do corpo: também invalida o SVG
  do corpo enquanto varre.
- O relato do dono é ~10 fps na Estante, com muitas animações. Um dev build é
  mais lento que o release, mas 10 fps indica custo estrutural, não só overhead
  de desenvolvimento.

## Fora de escopo

- Remover o tassel, o brilho ou a piscada, ou mudar o modelo C aprovado.
- Redesenhar a lombada, a capa, o rosto ou os tamanhos.
- Trocar versões de Reanimated/react-native-svg.
- S12 (release interno), exceto usar um build release para medir.

## Tarefas

1. **Medir antes**, no aparelho: Perf Monitor (JS e UI) com poucas lombadas e com
   a estante cheia; anotar fps em dev e em release. O número do release é o que
   vale para decidir.
2. **Virtualizar a grade:** `FlatList` com `numColumns={2}` e
   `ListHeaderComponent` (saudação, busca, filtros e resumo), mantendo o
   `StatusWheelTrigger`, os slots de resenha e as alturas. Só monta o que está
   perto da tela.
3. **Isolar o tassel do corpo:** deixar corpo/rosto/faixas num SVG estático e
   animar o tassel (corda+cabeça, franja, sombra) em SVGs pequenos com
   `Animated.View`/transform (técnica 3 do lab da S11b) ou matriz num SVG
   separado. O corpo deixa de ser redesenhado a cada frame. Manter o clip da
   corda e o modelo C.
4. **Tirar o `FeGaussianBlur` do caminho animado:** trocar a sombra por um
   `Ellipse` com gradiente radial (visual equivalente, sem bitmap por frame).
5. **Brilho:** animar um overlay separado com transform de `View` (ou deixar o
   `x` num SVG só do brilho), para o corpo estático não invalidar.
6. **Cache e memo:** `renderToHardwareTextureAndroid`/`shouldRasterizeIOS` no
   corpo estático e `React.memo` nos cards; conferir memória.
7. **Medir depois** com o mesmo roteiro e registrar os números.
8. **Docs:** ADR 0024 (ou adendo à 0023) com a técnica e os números;
   `assets-3d.md`, `design-system.md`, `testing.md`, `CURRENT.md`, `roadmap.md`,
   `CHANGELOG.md`.
9. **Testes:** grade virtualizada, header/filtros/busca, wheel, slots e toque;
   não afirmar frames.

## Aceite

- [ ] A Estante com a estante cheia roda a 60 fps (ou sem queda perceptível) no
      Android, medido antes/depois; o número do release está registrado.
- [ ] Tassel, brilho e piscada continuam funcionando; nenhuma animação foi
      removida.
- [ ] Layout, alturas, busca, filtros, wheel e toque na lombada iguais.
- [ ] Sem `FeGaussianBlur` em elemento animado e sem redesenhar o corpo inteiro
      por frame.
- [ ] Testes, lint, typecheck, doctor e export verdes.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec, `docs/adr/0023-animacao-do-tassel.md`,
`src/features/library/EstanteScreen.tsx`, `src/components/ui/Spine.tsx`,
`SpineArtwork.tsx`, `Card.tsx` e `StatusWheelTrigger.tsx`.

## Arquivos prováveis

- `src/features/library/EstanteScreen.tsx` (+ teste)
- `src/components/ui/SpineArtwork.tsx`, `Spine.tsx` (+ teste)
- `src/components/ui/Card.tsx` (cache/memo)
- `docs/adr/0024-*.md`, `docs/design/assets-3d.md`, `docs/testing.md`

## Riscos

- **Virtualização:** o header e o scroll da Estante podem quebrar; isolar o
  `ListHeaderComponent` e conferir a posição do wheel.
- **Isolar o tassel:** o clip da corda e o filtro da sombra precisam continuar
  iguais; conferir no cheio e no compacto, em 3 gêneros.
- **Transform de View × matrix:** a técnica 3 do lab animou; validar que o clip e
  o follow-through da franja sobrevivem.
- **Release engana:** medir no dev pode exagerar a queda; não otimizar às cegas
  antes de ter o número do release.
- **Memória:** cache de textura em muitas lombadas pode trocar fps por RAM;
  medir.

## Próximo depois desta

**S12** — release interno, com a spec em `docs/sessions/S12-release-interno.md`.
