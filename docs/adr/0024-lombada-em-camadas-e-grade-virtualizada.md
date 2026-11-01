# ADR 0024 — Lombada em camadas e grade virtualizada

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S11c
- **Relacionada:** complementa a ADR 0023 (o balanço continua o modelo C)

## Contexto

Com **5 livros**, a Estante em dev media **UI 11 fps / JS 56 fps**. O JavaScript
estava saudável: o gargalo era a thread de UI desenhando SVG. Cada lombada era um
único `<Svg>` grande, e quatro matrizes do tassel, o `x` do brilho e a opacidade do
“zzz” invalidavam esse SVG inteiro a cada frame. A sombra do tassel ainda usava
`FeGaussianBlur` dentro do grupo animado, o que podia re-rasterizar o blur por
frame.

O número de cards não era o problema naquele momento — uma lombada animada já
custava caro. Mas a Estante é a tela principal e o dono pode chegar a **milhares
de livros**: a grade também precisa escalar sem montar milhares de SVGs animados.

## Decisão

### 1. Separar o corpo estático das camadas animadas

`SpineArtwork` deixou de ser um SVG único:

| Camada | O que desenha | Como anima |
|---|---|---|
| Corpo | gradiente, faixas, nervuras (um `Svg` estático) | nada |
| Brilho | barra numa `View` recortada no corpo | `translateX` na `View` |
| Rosto | boca + olhos estáticos (outro `Svg`) | — |
| Piscada | só os olhos, num `Svg` recortado | opacidade da `Animated.View` |
| “zzz” | três letras, num `Svg` recortado | opacidade da `Animated.View` |
| Tassel | sombra, corda+cabeça e franja, em três `Svg` recortados | `rotate` em três `Animated.View` |

O corpo estático nunca é tocado por frame. A técnica do tassel passa a ser a
**3** do lab da S11b (`Animated.View` + `transform`), que já tinha sido conferida
no Android; `matrix` sai do caminho animado. Cada camada é recortada no próprio
sistema 64×128 (`viewBox` pequeno) e posicionada por porcentagem, então o cheio
(64×128), o compacto (52×104) e a mini (30×60) continuam 1:2.

`transformOrigin` fica em px calculados do tamanho real da lombada:

- corda/cabeça e sombra: `(6, 0)`; como o recorte começa em `x=-4`, a origem
  local é `10/64` da largura;
- franja: `(6, 9)`.

### 2. Corda em `y=2.1`, sem `bodyClip`

O clip existia para esconder a corda acima da silhueta do corpo. Começando em
`y=2.1`, a corda já nasce dentro da capa (o clip antigo escondia acima de ~1,08),
o comprimento visível fica praticamente igual e o topo não descola no pico de
10°. Isso remove um `ClipPath` fixo e uma camada do desenho.

### 3. Sombra com gradiente radial

`FeGaussianBlur` sai; a sombra vira uma `Ellipse` com `RadialGradient` (navy
0,3 → 0,2 → 0). O visual é equivalente e não há bitmap desfocado por frame.

### 4. `memo` onde o React ainda redesenha

`Spine` memoiza `resolveSpineArt` (paleta estável) e `SpineArtwork` usa
`memo`. O preview da roda de status re-renderiza o card, mas não o corpo do SVG.

### 5. Grade virtualizada

A Estante troca o `ScrollView` + `flex-wrap` por um `FlatList`
`numColumns={2}`:

- saudação, contagem, atalho “Meu ritmo”, busca e filtros viram
  `ListHeaderComponent` (rolam junto, sem remontar o campo de busca);
- o vazio vira `ListEmptyComponent`;
- `initialNumToRender={6}`, `maxToRenderPerBatch={8}`, `windowSize={5}` e
  `removeClippedSubviews`;
- só a primeira leva anima `FadeInDown`; rolar não pisca cards novos;
- a lista completa continua em memória (busca e filtros locais), mas
  `visibleBooks` é memoizado — a roda de status não refiltra a estante.

## Consequências

- Por frame só mudam `transform`/`opacity` de Views pequenas; o corpo estático e
  as camadas não tocadas não são redesenhadas. O ganho principal vem daí.
- Cada lombada montada passa a ter ~7–9 views nativas em vez de um SVG grande.
  Com a grade virtualizada, só a janela visível existe; a troca é favorável.
- Medição de referência: **UI 11 / JS 56 fps em dev com 5 livros** (baseline).
  A confirmação de 60 fps no aparelho fica para a medição final no APK da S12 —
  dev build exagera a queda e não serve como aceite.
- `renderToHardwareTextureAndroid`/`shouldRasterizeIOS` **não** foram ligados:
  cache de textura troca fps por RAM e precisa de medição. Fica como próxima
  alavanca se o aparelho ainda não chegar a 60.
- Milhares de linhas cabem na lista em memória (busca/filtros/ordem/contagem
  usam a lista inteira). Se o volume passar de dezenas de milhares, o próximo
  passo é paginar o repositório e mover busca/filtro para o SQL — não foi feito
  agora para não quebrar backup, ordem e resenhas.
- A piscada da lombada e a do selo da capa continuam no mesmo tempo, agora via
  `useBlink` compartilhado.
- Testes afirmam montagem, `testID`, busca sobre a lista inteira e que só a
  primeira leva é montada — nunca frames.

## Alternativas descartadas

- **Manter `matrix` no SVG grande e só otimizar o blur:** o custo dominante era
  invalidar o corpo inteiro por frame, não só o filtro.
- **Um `Svg` por camada, mas mantendo tudo em um único componente sem recorte:**
  o overlay ocuparia a lombada inteira e voltaria a invalidar uma área grande.
- **`FlashList`/virtualização de terceiros:** nova dependência para um caso que
  `FlatList` resolve; a S11c evita trocar versões e pacotes.
- **Paginar o repositório agora:** muda busca, filtros, contagem, ordem e backup;
  o custo real de memória com milhares de linhas é aceitável e mensurável.
- **Remover o tassel/brilho/piscada:** fora de escopo; as animações são a
  identidade da Estante.
