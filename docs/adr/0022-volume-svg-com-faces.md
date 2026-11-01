# ADR 0022 — Volume da lombada e da capa em SVG com faces

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S11a

## Contexto

A lombada da S4a era um retângulo arredondado com uma faixa escura de 24% da
largura à direita. O olho lia "2D com sombra", não uma face lateral; e a lombada
era tão larga quanto a capa, o que fazia um livro fino parecer um tijolo. A capa
tentava virar livro com um bloco creme de 7% e três linhas, estreito demais para
parecer páginas.

A spec da S11a pedia volume, uma lombada visivelmente mais estreita e o selo de
emoção da capa com a mesma piscada da lombada. As alternativas eram:

1. perspectiva nativa (`rotateY`/`perspective` do RN) sobre as duas faces;
2. uma imagem raster por status/cor;
3. desenhar as faces no próprio SVG, com paleta derivada da cor do gênero.

O app já é vetorial e paramétrico (ADR 0011): qualquer hex de gênero precisa
funcionar, sem matriz de assets, e o SVG é a única fonte de arte.

## Decisão

**O volume é desenhado no SVG, com frente e face lateral; não há transformação
3D nativa.** A técnica é a mesma para a lombada e para a capa:

- a lombada tem viewBox **52×128** (compacto 42×104) e a capa 88×128 (72×104);
  a diferença de largura é intencional e a altura é a mesma;
- a frente recebe um gradiente horizontal de quatro paradas
  (`edge → base → light → side`), derivadas do hex do gênero;
- a face lateral ocupa ~10% da largura (5 px no cheio, ~4 px no compacto) e é
  separada por um vinco de 1 px; as faixas de topo/base acompanham a frente e
  morrem na lateral em leve diagonal;
- o rosto é redesenhado para o formato estreito (não comprimido de 100×140),
  com olhos redondos e próximos e boca curta;
- o tassel é uma fita de ~4 px com ponta em V na cor `accent`, derivada da base
  e do `ink`, pendurada na base dentro do slot; balança ±2,8° em 1,7 s;
- a capa troca a etiqueta de 7% por um trapézio de páginas de 11% com oito
  níveis de segmentos que leem como texto, vinco na divisa e canto externo
  arredondado;
- o selo da capa usa o mesmo `SpineFace` da lombada, com a piscada no mesmo
  componente (opacidade dos olhos em `happy`/`neutral`);
- a sombra de contato é curta, navy e aplicada no wrapper (`contactShadow` no
  tema), sem mexer no layout nem no `Pressable`.

`SpinePalette` passa a expor `side`, `edge`, `light`, `shadow`, `accent` e
`gradient`; `shade` foi substituído.

## Consequências

- A lombada lê como objeto fino e com volume nos quatro status e em qualquer
  cor de gênero, inclusive escura.
- A capa e a lombada compartilham rosto, piscada e sombra; não há dois desenhos
  para manter.
- O desenho da lombada não é mais o mesmo viewBox da capa: mudanças de arte
  precisam ser feitas em 52×128, e não "esticadas" de um formato para o outro.
- A mini-lombada de "Meu ritmo" passou de 30×44 para 30×74 para manter a
  proporção; a fileira de concluídos fica ~30 px mais alta.
- A etiqueta de título em 52 px quebra mais fácil; as telas principais usam
  `showLabel={false}` e o preview de gênero ganhou padding menor.
- Duas faces chapadas ainda podem parecer "2D com sombra" em tela pequena; a
  conferência é visual, no aparelho, e não há snapshot de imagem.

## Alternativas descartadas

- **`rotateY`/`perspective` nativo:** o RN aplica a transformação no container,
  não nas faces; seriam necessários dois planos absolutos, mais frágeis no
  Android e no teste, e o conjunto ainda precisaria do desenho da lateral.
- **Raster por status/cor:** volta ao problema da ADR 0011 — gênero tem hex
  livre e o bundle cresceria com combinações que ninguém usa.
- **Lombada de 46 px ou menos:** espreme os dois olhos e o tassel.
- **Manter 88 px e só afinar a face:** a lombada continuaria lendo como capa.
- **Tassel com física:** escopo e risco de toque/layout sem ganho perceptível;
  o balanço é um `transform` de ida e volta.
