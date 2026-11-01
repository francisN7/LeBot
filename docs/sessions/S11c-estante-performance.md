# S11c — Estante fluida sem tirar as animações

## Objetivo

Fazer a Estante rodar a 60 fps (ou sem queda perceptível) no Android com **5
lombadas**, mantendo o balanço do tassel, o brilho que varre a lombada e a
piscada; e deixar a grade pronta para escalar com muitas lombadas.

## Contexto

- **Medição do dono (dev, 5 livros):** UI **11 fps**, JS **56 fps**, Layout 1 ms.
  O JavaScript está saudável; o gargalo é a thread de UI desenhando SVG. Não é
  re-render de React nem tamanho da grade.
- Cada lombada é um `<Svg>` grande: corpo, faixas, nervuras, rosto, brilho e
  tassel. O tassel anima **quatro matrizes** contínuas no mesmo SVG (corpo,
  cabeça, franja e sombra); cada atualização invalida o SVG inteiro. A sombra usa
  `FeGaussianBlur` **dentro** do grupo animado, então o blur pode ser
  re-rasterizado a cada frame.
- O brilho anima a prop `x` de um `Rect` dentro do corpo; o “zzz” anima opacidade
  no mesmo SVG. Os dois também invalidam o corpo inteiro.
- Com 5 livros o custo já derruba: é por lombada **animada**, não pelo número de
  cards. A virtualização não resolve o caso atual, mas é obrigatória para 30+.
- Um dev build é mais lento que o release; o número final será medido no APK da
  S12, mas a estrutura se corrige aqui.

## Fora de escopo

- Remover o tassel, o brilho ou a piscada, ou mudar o modelo C aprovado.
- Redesenhar a lombada, a capa, o rosto ou os tamanhos.
- Trocar versões de Reanimated/react-native-svg.
- S12 (release interno), exceto usar o build release para a medição final.

## Decisões fechadas

- Isolar as camadas animadas **antes** de virtualizar a grade.
- A corda do tassel passa a começar em `y=2.1` e o `bodyClip` sai: o clip atual
  já esconde acima de ~1,08, então o comprimento visível fica equivalente e a
  corda não descola do topo.
- A técnica do tassel é a **3** do lab da S11b (`Animated.View` + `transform`),
  confirmada no Android.

## Tarefas

1. **Registrar o baseline** medido (UI 11 / JS 56 com 5 livros, dev) e repetir o
   roteiro no fim.
2. **Separar o corpo estático das camadas animadas** — o ganho principal:
   - corpo, faixas, nervuras e rosto num `Svg` que não é tocado por frame;
   - tassel (corda+cabeça, franja e sombra) em SVGs pequenos, movidos por
     `Animated.View`/`transform`; a matriz sai do SVG grande;
   - “zzz” num `Svg` próprio (só opacidade);
   - brilho num `Svg` próprio com o clip do corpo, animando só ali.
3. **Tirar o `FeGaussianBlur` do caminho animado:** sombra com `Ellipse` de
   gradiente radial (visual equivalente, sem bitmap por frame).
4. **Corda em `y=2.1`**, sem `bodyClip`; conferir no 64, no 52 e nos 3 gêneros.
5. **Medir de novo com 5 livros** e comparar UI/JS. Se ainda não chegar a 60,
   investigar o brilho e a piscada antes de mexer na grade.
6. **Virtualizar a grade** para escala: `FlatList` com `numColumns={2}` e
   `ListHeaderComponent` (saudação, busca, filtros e resumo), mantendo o
   `StatusWheelTrigger`, os slots de resenha e as alturas.
7. **Medir com estante cheia** (duplicar o seed em teste local) e registrar.
8. **Cache/memo só se precisar:** `renderToHardwareTextureAndroid`/
   `shouldRasterizeIOS` no corpo estático e `React.memo` nos cards; conferir
   memória.
9. **Docs:** ADR 0024 (ou adendo à 0023) com a técnica e os números;
   `assets-3d.md`, `design-system.md`, `testing.md`, `CURRENT.md`, `roadmap.md`,
   `CHANGELOG.md`.
10. **Testes:** grade virtualizada, header/filtros/busca, wheel, slots e toque;
    não afirmar frames.

## Resultado (2026-11-01)

- Baseline registrado: **UI 11 fps / JS 56 fps** em dev com 5 livros.
- Corpo estático separado; brilho (View recortada), piscada (opacidade), “zzz”
  (SVG próprio) e tassel (três `Animated.View` recortadas) são camadas
  independentes. `matrix` saiu do caminho animado; a técnica é a 3 do lab.
- Corda em `y=2.1`, sem `bodyClip`; sombra radial no lugar de `FeGaussianBlur`.
- `Spine` memoiza a paleta e `SpineArtwork` usa `memo`.
- Grade em `FlatList` `numColumns={2}` com header/lista vazia e virtualização
  (`initialNumToRender` 6, lote 8, `windowSize` 5); `visibleBooks` memoizado.
  Milhares de livros entram na lista em memória, mas só a janela visível monta.
- `renderToHardwareTextureAndroid`/`shouldRasterizeIOS` não foram ligados — ficam
  como próxima alavanca, dependente de medição e memória.
- **Medido no Android (dev, 5 livros):** UI **84 fps**, JS **84 fps**, Layout
  1 ms, RAM **342,75 MB**. Antes: UI 11 / JS 56. A queda sumiu; o número final
  no APK fica na S12, e a estante cheia ainda será medida lá. Nenhum frame foi
  afirmado em teste.

## Aceite

- [x] Com **5 livros**, a UI fica em 60 fps (ou sem queda perceptível) no
      Android; UI/JS medidos antes e depois (**11/56 → 84/84 fps** em dev). O
      número final no release fica registrado na S12.
- [x] Tassel, brilho e piscada continuam; nenhuma animação foi removida e o
      modelo C segue igual.
- [x] A corda continua presa ao topo, sem `bodyClip` e sem mudar o comprimento
      visível de forma perceptível.
- [x] Sem `FeGaussianBlur` em elemento animado e sem redesenhar o corpo inteiro
      por frame.
- [x] A grade virtualizada aguenta muitas lombadas sem mudar layout, alturas,
      busca, filtros, wheel ou toque.
- [x] Testes, lint, typecheck, doctor e export verdes.

## Contexto necessário

`AGENTS.md`, `docs/state/CURRENT.md`, esta spec,
`docs/adr/0023-animacao-do-tassel.md`, `src/features/library/EstanteScreen.tsx`,
`src/components/ui/Spine.tsx`, `SpineArtwork.tsx`, `Card.tsx` e
`StatusWheelTrigger.tsx`.

## Arquivos prováveis

- `src/components/ui/SpineArtwork.tsx`, `Spine.tsx` (+ teste)
- `src/features/library/EstanteScreen.tsx` (+ teste)
- `src/components/ui/Card.tsx` (cache/memo, se necessário)
- `docs/adr/0024-*.md`, `docs/design/assets-3d.md`, `docs/testing.md`

## Riscos

- **Isolar camadas:** o clip da corda, o follow-through da franja e a sombra
  precisam continuar iguais; conferir no cheio/compacto e em 3 gêneros.
- **Corda em y=2.1:** validar que a ponta não aparece no pico (10°) e que o
  comprimento visível não muda de forma perceptível.
- **Virtualização:** o header e o scroll podem quebrar; isolar o
  `ListHeaderComponent` e conferir a posição do wheel.
- **Release engana:** o dev build exagera a queda; usar o APK da S12 para o
  número final.
- **Memória:** cache de textura em muitas lombadas troca fps por RAM; medir.

## Próximo depois desta

**S12** — release interno, com a spec em `docs/sessions/S12-release-interno.md`.
