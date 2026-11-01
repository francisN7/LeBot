# Arte 3D — lombadas e mascote

Sistema de identidade da Estante e da Hoje. Fonte da verdade visual:
`docs/brand.md`; decisões de formato: ADR 0011 (arte vetorial) e ADR 0022
(lombada B e capa com profundidade).

## Formato

- **Runtime:** vetorial (`react-native-svg`). Nenhuma imagem de lombada ou
  mascote entra no bundle.
- **Fonte da arte:** código — `src/features/library/spine-art.ts` (mapa puro) e
  `src/components/ui/{SpineArtwork,Mascot}.tsx` (desenho).
- **Raster:** só ícone, camada adaptativa, monocromático, splash e favicon, em
  `assets/images/`, gerados de `brand/source/mark.svg` e `mark-mono.svg`.
- **Nada de rede em runtime.** Baixar asset não existe neste app.

## Grade de tamanhos

| Peça | Token/tamanho | Onde |
|---|---|---|
| Capa cheia | `sizes.cover` — 88×128 | Estante, detalhe |
| Capa compacta | `sizes.coverCompact` — 72×104 | Ordem, blocos da Hoje |
| Lombada cheia | `sizes.spine` — 64×128 | Estante, detalhe, prévia de gênero |
| Lombada compacta | `sizes.spineCompact` — 52×104 | Ordem, blocos da Hoje |
| Mini-lombada | `Spine` 30×60 | Concluídos em "Meu ritmo" |
| Mascote pequeno | 72 px de largura | Card "LêBot diz" na Hoje |
| Mascote médio | 96 px | Estado vazio da Estante |
| Mascote grande | 120 px (padrão) | estados de destaque; nenhuma tela usa hoje |
| Fita de gênero | `sizes.bookmark` — 18×28 | Sobre a capa |

A capa e a lombada têm larguras diferentes de propósito: a lombada (64 px) lê
como livro ao lado da capa (88 px), sem parecer uma fita. A altura é a mesma,
então cards, Ordem, Hoje e detalhe não mudam de alinhamento. O desenho usa
`viewBox` fixo (64×128 na lombada, 120×130 no mascote) e escala com o tamanho
pedido; não há asset por tamanho. Todas as medidas mantêm a proporção **1:2**
(64×128, 52×104 e a mini 30×60).

## Lombada: cor × expressão

A cor vem do gênero (`color_light` até existir tema escuro) e a expressão do
status. Não existe combinação fixa: qualquer hex gera uma lombada.

| Status | Expressão | Rosto |
|---|---|---|
| `reading` — Lendo | `happy` | olhos em arco e sorriso |
| `queued` — Quero ler | `neutral` | olhos redondos e boca oval |
| `paused` — Pausado | `sleepy` | olhos fechados e "zzz" flutuante |
| `finished` — Concluído | `shine` | olhos em estrela e sorriso aberto |

Paleta derivada (`spine-art.ts`):

- `base` = hex do gênero, normalizado;
- `edge` = vinco/charneira, borda do cilindro e arestas, mistura de 20–28%;
- `light` = luz do gradiente, mistura com creme de 16–20%;
- `shadow` = sombra de contato, mistura de 55%;
- `highlight` = faixas de topo/base e brilho, mistura com creme de 28–60%;
- `gradient` = `[edge, base, light, edge]`, as quatro paradas da frente;
- `ink` = navy quando o contraste com a base é ≥ 3:1, senão creme. Garante rosto
  visível no preset `navy` e em cores personalizadas escuras.

Sem status, ou com hex inválido, a UI usa a lombada 2D chapada em `navyMuted`.

## Lombada B: volume, etiqueta e tassel

A lombada aprovada é a **B**, desenhada no viewBox **64×128** (compacto 52×104,
mesma proporção). Não é o viewBox antigo comprimido: olhos, boca, tassel e
faixas foram desenhados para esse formato, senão o rosto vira um oval.

- **Corpo cilíndrico:** gradiente horizontal de quatro paradas (`edge → base →
  light → edge`) e uma sombra vertical discreta nas pontas. Não há face lateral
  chapada: a lombada de frente é uma curva, não um tijolo.
- **Headband/tailband:** faixas listradas a 7 px do topo e a 111 px, com o
  contorno do `edge`.
- **Nervuras:** dois relevos horizontais (52 e 103 px) com sombra acima e luz
  abaixo.
- **Etiqueta de título:** retângulo creme com borda navy no topo (15–59 ×
  18–45), **só com o título, centralizado**, em até duas linhas. É uma View do
  `Spine` (texto real e acessível pelo rótulo do `Pressable`), não texto no SVG.
  O autor e o título completo continuam no card abaixo. `showLabel={false}`
  esconde a etiqueta (mini-lombadas); as telas principais mantêm o padrão.
- **Tassel T1:** no **canto superior esquerdo**, preso ao headband. Argola
  cortada pelo topo do SVG (parece sair de dentro), corda, corpo, pescoço e
  franja de seis fios dourados com contorno navy. É um tassel de verdade, não
  uma ponta de fita; fica estático.
- **Rosto:** olhos em `happy` um pouco mais afastados (spread 10) para o “Lendo”
  não parecer apertado; as outras expressões usam 8.
- **“zzz”:** três letras em diagonal no canto direito (49/73, 53/67 e 57/60),
  com opacidade 1 → 0,3 e `translateY` de 0 → −2 px; só em `sleepy`.
- **Sombra de contato:** `contactShadow` no wrapper; o corpo ocupa 126 dos
  128 px e o `Pressable` pinta o fundo com a cor do gênero, sem borda duplicada.

O fallback 2D usa o mesmo slot de 64×128 (52×104 compacto), chapado, com a
etiqueta de título no rodapé quando `showLabel` está ligado.

## Mascote: estados

| Estado | Quando usar | Diferença no desenho |
|---|---|---|
| `neutral` | telas padrão, estado vazio | olhos redondos, piscada |
| `reading` | sessão de leitura ativa | olhos baixos, livro aberto |
| `happy` | meta batida, sequência | olhos em estrela, sorriso |
| `sleepy` | pausa, dia de descanso | olhos fechados e "z" |
| `thinking` | dicas do plano, busca sem resultado | balão de pensamento |
| `celebrating` | livro concluído, resenha | boca aberta e confete |

Animação (Reanimated): respiração de 1,0 a 1,025 em 1,8 s (ida e volta) e
piscada de 90 ms a cada ~2,6 s nos estados de olhos redondos. Sem física 3D, sem
laço de animação por estado.

Acessibilidade: o wrapper anuncia o estado (`mascotLabel`); o SVG é decorativo
(`accessibilityElementsHidden`). Para mudar o texto, use
`accessibilityLabel`.

## Ícone e splash

| Arquivo | Tamanho | Regra |
|---|---|---|
| `icon.png` | 1024² | fundo pink cheio, marca a 86% (o SO arredonda) |
| `android-icon-background.png` | 1024² | pink sólido |
| `android-icon-foreground.png` | 1024² | marca a 80%, transparente |
| `android-icon-monochrome.png` | 1024² | silhueta preta com olhos vazados |
| `splash-icon.png` | 768² | marca a 90%, transparente, sobre creme |
| `favicon.png` | 64² | fundo pink, marca a 80% |

Gerar de novo:

```bash
node scripts/build-icons.mjs
```

O script rasteriza já no tamanho final (redimensionar depois deixa halo claro no
contorno), usa compressão 9 e não grava metadados.

## Movimento

Regra: a **grade** reage (toque, status, entrada); o **detalhe** respira (loop
contínuo, porque há um livro só).

| Elemento | Gesto | Onde |
|---|---|---|
| Lombada | mola de escala 0,97 e inclinação −2° no toque | grade e detalhe |
| Lombada | piscada: olhos somem por 70 ms a cada ~2,9 s | `happy`, `neutral` |
| Lombada | brilho varre o corpo a cada ~3,3 s | todas |
| Lombada | "zzz" flutua na diagonal: opacidade 1→0,3 e −2 px | `sleepy` |
| Lombada | flutuação de 3% e −2,4 px, ida e volta em 4,4 s | só `animated` (detalhe) |
| Capa | mola de escala 0,97 e inclinação −1,5° no toque | grade e detalhe |
| Capa | brilho diagonal atravessa a capa em 1,7 s | só `animated` (detalhe) |
| Capa | selo pisca os olhos como a lombada | `happy`, `neutral` |
| Grade | `FadeInDown` com 45 ms de atraso por card (máx. 6) | troca de filtro/busca |
| Mascote | respiração 1,04 e −2 px, 4 s ida e volta | sempre |
| Mascote | piscada de 90 ms a cada ~2,8 s | estados de olhos redondos |
| Mascote | acessórios pulsam entre 1 e 0,35 | `sleepy`, `celebrating` |
| Mascote | fade de 200 ms ao trocar de estado | sempre |

A piscada da lombada e a do selo vivem no mesmo `SpineFace`; não duplique os
tempos em outro componente. O tassel é estático (fica no topo, preso ao
headband). Todas as animações usam `transform` e `opacity`, no UI thread; nenhuma
mexe em layout. Sem `useReducedMotion` por enquanto — fica no backlog de
acessibilidade.

## Capa personalizada como livro

Uma foto recortada parece um card. A revisão aprovada **não cobre a arte com
páginas**: a profundidade é feita com sombra e luz **sobre a própria foto**, para
as cores da capa continuarem no fundo.

1. **Vinco de lombada (S2):** gradiente preto de 38% na borda esquerda (0–14%),
   com um fio de luz creme em 13–20%. Sugere a lombada sem faixa colorida.
2. **Sombra de borda:** gradiente preto de 42% na direita (76–100%) e 30% na
   base (88–100%), além de um fio de luz creme no topo/esquerda.
3. **Selo de status** no canto inferior direito (`right: xs`): quadrado creme com
   borda navy e o rosto da lombada (mesmo `SpineFace`, mesma piscada). Largura
   `width * 0.26` limitada a 18–26 px, para não dominar o 72×104.

A fita do gênero continua no topo esquerdo. Com `status`, o selo aparece em todos
os quatro estados — o preview do formulário passa o status escolhido. A capa
também ganha a sombra de contato curta (`contactShadow`), no mesmo vocabulário da
lombada. O brilho diagonal (`animated`) fica sob a camada de sombra.

## Cache e performance

- Não há cache de imagem: o SVG é recalculado por render. `resolveSpineArt` é
  uma função pura e barata (duas misturas de hex + um contraste).
- Evite chamar `resolveSpineArt` em laço de animação; a paleta é estável por
  livro.
- O `Mascot` anima só `transform` e o raio dos olhos — propriedades que não
  disparam layout.

## Contraste e legibilidade

- Etiqueta de título sempre sobre `cream` (topo) ou `cream/95` (rodapé do
  fallback), nunca direto sobre a cor.
- Rosto com contraste ≥ 3:1 contra a base.
- A fita de gênero sobre a capa usa o mesmo par de cores do gênero.
- O teste da paleta continua exigindo 3:1 contra creme **ou** navy.
