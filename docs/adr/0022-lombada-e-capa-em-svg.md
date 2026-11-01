# ADR 0022 — Lombada B e capa com profundidade em SVG

- **Status:** aceito
- **Data:** 2026-11-01
- **Sessão:** S11a

## Contexto

A primeira tentativa da S11a desenhou a lombada em 52×128 com uma face lateral
chapada de ~10% e a capa com um bloco de páginas por cima da foto. Aprovada no
papel, a arte não passou na conferência visual: a face lateral lia como um
tijolo, a lombada parecia uma fita e o bloco de páginas parecia erro de recorte.
O tassel era uma ponta de fita escura, não um tassel.

O dono pediu referência real e aprovou os modelos A–D (lombada) e S1–S3 (capa).
A direção escolhida foi a **B**, com 64×128, o tassel no canto superior esquerdo
e a profundidade da capa feita **com sombra sobre a própria foto**.

Restrições: arte vetorial e paramétrica (ADR 0011), qualquer hex de gênero, sem
matriz de assets, sem transformação 3D nativa e com o toque no `Pressable`.

## Decisão

1. **Largura 64×128 (compacto 52×104), proporção 1:2 exata.** A capa segue
   88×128 (compacta 72×104). A lombada é mais estreita que a capa, mas não uma
   fita. A mini-lombada de "Meu ritmo" fica 30×60 para manter a proporção.
2. **Corpo cilíndrico, sem face lateral.** A frente recebe um gradiente
   horizontal de quatro paradas (`edge → base → light → edge`) e uma sombra
   vertical discreta nas pontas. Headband/tailband listradas e duas nervuras
   (52 e 103 px) dão a anatomia de capa dura.
3. **Etiqueta de título no topo**, creme com borda navy, **centralizada**
   (11–53 × 19–38 no viewBox), **só com o título**, em até duas linhas. É uma
   View do `Spine` com `AppText` em Fredoka 600: o tamanho encolhe de 7 a 5 via
   `fitSpineTitle` e, no mínimo, o `Text` aplica ellipsis. O autor continua no
   card abaixo.
4. **Tassel T1 no canto superior esquerdo**, sem argola: a corda sai do topo
   (cortada pela borda, parece vir de dentro), encontra corpo e pescoço e
   termina na franja de seis fios. O dourado usa gradiente, aresta escura e
   sombra desfocada no corpo; o grupo balança ±3° em 1,7 s em torno do topo.
5. **Rosto compartilhado (`SpineFace`)** entre a lombada e o selo da capa. Em
   `happy` os olhos abrem um pouco mais (spread 10); as outras expressões usam 8.
   No `sleepy`, um “zzz” de três letras flutua na diagonal.
6. **Capa sem páginas e sem faixa lateral.** A foto fica inteira. A profundidade
   S2 é uma camada de sombra sobre a capa: vinco à esquerda (preto 38%), fio de
   luz creme em 13–20%, sombra de borda à direita (42%) e na base (30%), fio de
   luz no topo/esquerda. O selo e a fita ficam por cima.
7. **Sombra de contato nativa** (`contactShadow`) no wrapper da lombada e da
   capa; o corpo da lombada ocupa 126 dos 128 px. O `Pressable` da arte é
   transparente (o fundo na cor do gênero virava um retângulo nos cantos) e o
   contorno navy vem do SVG.

`SpinePalette` expõe `base`, `edge`, `light`, `shadow`, `highlight`, `ink` e
`gradient` (`[edge, base, light, edge]`). `side` e `accent` saíram.

## Consequências

- A lombada lê como livro nos quatro status e em qualquer cor de gênero, com
  etiqueta legível e tassel reconhecível.
- A capa mantém as cores e a arte originais; a profundidade funciona em fotos
  claras e escuras sem cobrir a imagem.
- A etiqueta é uma View, então o título pode ter duas linhas, encolher e usar
  ellipsis; o custo é mais um nó por lombada.
- A mini-lombada 30×60 reduz a altura da fileira de concluídos em relação ao
  30×74 da primeira tentativa.
- O tassel balança ±3° e usa gradiente/sombra; não é um adesivo estático.
- A conferência continua visual no aparelho; não há snapshot de imagem.

## Alternativas descartadas

- **Face lateral chapada (primeira tentativa):** lia como tijolo e não como
  lombada de frente.
- **Bloco de páginas por cima da foto:** parecia recorte e cobria a arte; a
  sombra sobre a foto preserva a capa.
- **Tassel de fita com ponta em V:** é um marcador de fita, não um tassel; a
  franja e o corpo são o que o olho reconhece.
- **`rotateY`/perspective nativo:** transforma o container, não as faces; mais
  frágil no Android e no teste.
- **Lombada de 46 px ou menos:** espreme os olhos e a etiqueta.
