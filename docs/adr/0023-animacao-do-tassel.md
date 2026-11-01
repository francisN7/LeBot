# ADR 0023 — Balanço do tassel com `matrix` animada

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S11b
- **Atualização:** a S11c trocou a técnica `matrix` por `Animated.View` + `rotate`
  em camadas recortadas (ADR 0024). O modelo C, os ângulos e os tempos continuam
  os mesmos.

## Contexto

A S11a aprovou o desenho do tassel T1 e tentou animá-lo com `AnimatedG` +
`rotation`/`origin` do Reanimated. No Android o tassel ficou **parado**. O mesmo
padrão já afetava o `translateY` do “zzz”, que também não se movia.

A causa está no `react-native-svg@15.16.0`: o `G` converte `rotation`, `origin`,
`scale` e `translateY` em `matrix` **durante o render**
(`src/elements/G.tsx:29` → `extractProps` → `extractTransform`). O componente
nativo do grupo recebe `matrix`, `opacity`, `fill` e companhia
(`src/fabric/GroupNativeComponent.ts:9-11`), mas **não** `rotation`/`origin`. Como
`animatedProps` escrevem direto na prop nativa, sem re-render, esses valores eram
descartados. `opacity` funcionava — é por isso que a piscada e o fade do “zzz”
animavam e o deslocamento dele não.

Um lab temporário (`dev-tassel`) comparou três técnicas no Android, com o mesmo
tassel e o mesmo ciclo:

1. `G` + `rotation` animado — **parado**, como na S11a.
2. `G` + `matrix` animada — **animou**.
3. `Animated.View` com `rotate` em volta de um `Svg` só do tassel — **animou**.

O dono aprovou o modelo **C** (rajada) e pediu o tassel preso ao topo no pico.

## Decisão

1. **Animar `matrix` no `G`**, não `rotation`. A matriz coluna-maior é calculada
   em worklet a partir de um `SharedValue` em graus:

   ```
   a = cos θ      b = sin θ
   c = -sin θ     d = cos θ
   e = ox (1 - cos θ) + oy sin θ
   f = -ox sin θ + oy (1 - cos θ)
   ```

   θ positivo (horário na tela) joga a ponta pendurada para a **esquerda**, para
   fora da lombada. `rotationMatrix()` marca `'worklet'` e roda no UI thread.
2. **Quatro grupos independentes**, cada um com seu `useAnimatedProps`:
   - corpo e cabeça giram em torno de (6, 0), com o mesmo ângulo (dois grupos
     separados para a corda poder ser clipada sem clipar o corpo);
   - a franja gira em torno do pescoço (6, 9), ~90 ms depois e 25% maior
     (follow-through);
   - a sombra gira em torno de (6, 0) com 55% do ângulo, ~40 ms depois.
3. **Modelo C aprovado**, ciclo de 4,4 s:

   | Parte | Pico | Tempo |
   |---|---|---|
   | Corpo | 10° | ataque ~400 ms, hesitação em 9,4°/9,8°, retorno com overshoot de 1,6° |
   | Franja | 12,5° | ~90 ms depois do corpo, overshoot de 2,8° |
   | Sombra | 5,5° | 55% do corpo, overshoot de 1° |

   A mesma amplitude vale no cheio (64×128) e no compacto (52×104).
4. **A corda é cortada pela silhueta do corpo.** Um `ClipPath` com o retângulo
   arredondado do corpo é aplicado num `G` **fixo**, por fora do grupo que gira;
   um clip dentro do grupo rodaria junto e não cortaria nada. Sem isso, o topo
   da corda flutua sobre o canto arredondado quando o tassel inclina. A franja
   fica fora desse clip e pode cruzar a borda.
5. **Sem `Animated.View` por enquanto.** A técnica 3 funciona e fica como
   fallback se uma atualização de Reanimated/react-native-svg quebrar `matrix`;
   ela custa um `Svg` extra por parte animada.

## Consequências

- O tassel balança para a esquerda, no cheio e no compacto, sem mexer em layout
  nem no `Pressable`. A sombra acompanha e a franja chega depois.
- São quatro worklets de matriz por lombada (corpo, cabeça, franja, sombra). O
  custo é só transform no UI thread; a grade com muitas lombadas precisa ser
  observada no aparelho, mas não há novos nós de view.
- `matrix` não é citada na documentação do Reanimated; o suporte foi verificado
  no Android e no código nativo do `react-native-svg`. Se a prop mudar de nome,
  o fallback é `Animated.View`.
- O `translateY` do “zzz” continua ignorado; só a opacidade anima. A diagonal é
  a posição fixa das três letras.
- Os testes afirmam montagem, `testID` e props — não frames.

## Alternativas descartadas

- **`AnimatedG` + `rotation`/`origin`:** o nativo ignora; foi o bug da S11a.
- **`transform` serializado no `G`:** também é convertido em `matrix` só no
  render (`extractTransform.ts:174-177`); o nativo não tem a prop.
- **Pêndulo simétrico (`withRepeat` com reverse):** o pedido é vento, com ataque
  rápido e retorno lento, não oscilação de relógio.
- **Amplitude menor no compacto:** o dono preferiu a mesma amplitude; o
  deslocamento em 52 px continua legível.
- **Clipe dentro do grupo animado:** o clip gira junto e não resolve o topo.
