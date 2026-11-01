# Arte 3D — lombadas e mascote

Sistema de identidade da Estante e da Hoje. Fonte da verdade visual:
`docs/brand.md`; decisão de formato: ADR 0011.

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
| Lombada cheia | `sizes.spine` — 52×128 | Estante, detalhe, prévia de gênero |
| Lombada compacta | `sizes.spineCompact` — 42×104 | Ordem, blocos da Hoje |
| Mini-lombada | `Spine` 30×74 | Concluídos em "Meu ritmo" |
| Mascote pequeno | 72 px de largura | Card "LêBot diz" na Hoje |
| Mascote médio | 96 px | Estado vazio da Estante |
| Mascote grande | 120 px (padrão) | estados de destaque; nenhuma tela usa hoje |
| Fita de gênero | `sizes.bookmark` — 18×28 | Sobre a capa |

A capa e a lombada têm larguras diferentes de propósito: a lombada (52 px) lê
como livro fino ao lado da capa (88 px). A altura é a mesma, então cards, Ordem,
Hoje e detalhe não mudam de alinhamento. O desenho usa `viewBox` fixo (52×128 na
lombada, 120×130 no mascote) e escala com o tamanho pedido; não há asset por
tamanho. A mini-lombada 30×74 mantém a proporção 1:2,46 da lombada nova.

## Lombada: cor × expressão

A cor vem do gênero (`color_light` até existir tema escuro) e a expressão do
status. Não existe combinação fixa: qualquer hex gera uma lombada.

| Status | Expressão | Rosto |
|---|---|---|
| `reading` — Lendo | `happy` | olhos em arco e sorriso |
| `queued` — Quero ler | `neutral` | olhos redondos e boca oval |
| `paused` — Pausado | `sleepy` | olhos fechados e "z" |
| `finished` — Concluído | `shine` | olhos em estrela e sorriso aberto |

Paleta derivada (`spine-art.ts`):

- `base` = hex do gênero, normalizado;
- `side` = face lateral direita, mistura com navy (fundo claro) ou preto (fundo
  escuro), 40–45%;
- `edge` = vinco/charneira e arestas, mistura de 20–28%;
- `light` = luz do gradiente, mistura com creme de 16–20%;
- `shadow` = sombra de contato, mistura de 55%;
- `highlight` = faixas de topo/base e brilho, mistura com creme de 28–60%;
- `accent` = tassel, mistura entre a base e o `ink` (45%) — funciona em cor
  clara e escura;
- `gradient` = `[edge, base, light, side]`, as quatro paradas da frente;
- `ink` = navy quando o contraste com a base é ≥ 3:1, senão creme. Garante rosto
  visível no preset `navy` e em cores personalizadas escuras.

Sem status, ou com hex inválido, a UI usa a lombada 2D chapada em `navyMuted`.

## Lombada: volume e tassel

A lombada é desenhada no viewBox **52×128** (compacto 42×104, mesma proporção).
Não é o viewBox antigo comprimido: olhos, boca, tassel e faixas foram desenhados
para esse formato, senão o rosto vira um oval.

- **Frente:** gradiente horizontal com quatro paradas (`edge → base → light →
  side`), limitado ao contorno arredondado.
- **Face lateral:** 5 px (≈9,6% da largura; ~4 px no compacto) na cor `side`,
  separada por um vinco de 1 px. É o que dá volume sem parecer um tijolo.
- **Vinco esquerdo:** filete discreto a 4 px da borda, no lugar do bloco de
  sombra de 24% da versão antiga.
- **Faixas de topo/base:** acompanham a frente e morrem na lateral com uma leve
  diagonal, sugerindo a perspectiva.
- **Tassel:** fita de ~4 px com ponta em V, na cor `accent`, pendurada na base
  dentro do slot. Balança ±2,8° em 1,7 s (ida e volta), sempre — só `transform`.
- **Sombra de contato:** curta e navy (`contactShadow` no tema), aplicada no
  wrapper para não mudar o layout nem o toque.

O fallback 2D usa o mesmo slot de 52×128 (42×104 compacto), chapado.

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
| Lombada | "z" pulsa entre 1 e 0,3 | `sleepy` |
| Lombada | tassel balança ±2,8° em 1,7 s, ida e volta | todas |
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
tempos em outro componente. Todas as animações usam `transform` e `opacity`, no
UI thread; nenhuma mexe em layout. Sem `useReducedMotion` por enquanto — fica no
backlog de acessibilidade.

## Capa personalizada como livro

Uma foto recortada parece um card; para parecer o mesmo objeto da lombada ela
recebe três camadas:

1. **Bloco de páginas** na borda direita: trapézio creme de 11% da largura (10 px
   na capa cheia, 8 px na compacta), com oito níveis de segmentos de larguras
   variadas — leem como texto sem tentar escrever palavras —, vinco navy na
   divisa e canto externo mais curto que o interno (perspectiva). O bloco fica
   dentro da borda, então os cantos arredondados recortam a página.
2. **Brilho diagonal** (banda branca a 18%) atravessando o canto superior
   esquerdo; no detalhe ele varre a capa.
3. **Selo de status** no canto inferior direito, deslocado para a esquerda da
   face de páginas (`right = página + xs`): quadrado creme com borda navy e o
   rosto da lombada (mesmo `SpineFace`, mesma piscada). Largura `width * 0.26`
   limitada a 18–26 px, para não dominar o 72×104.

A fita do gênero continua no topo esquerdo. Com `status`, o selo aparece em
todos os quatro estados — o preview do formulário passou a mandar o status
escolhido. A capa também ganha a sombra de contato curta (`contactShadow`), no
mesmo vocabulário da lombada.

## Cache e performance

- Não há cache de imagem: o SVG é recalculado por render. `resolveSpineArt` é
  uma função pura e barata (duas misturas de hex + um contraste).
- Evite chamar `resolveSpineArt` em laço de animação; a paleta é estável por
  livro.
- O `Mascot` anima só `transform` e o raio dos olhos — propriedades que não
  disparam layout.

## Contraste e legibilidade

- Etiqueta de título sempre sobre `cream/95`, nunca direto sobre a cor.
- Rosto com contraste ≥ 3:1 contra a base.
- A fita de gênero sobre a capa usa o mesmo par de cores do gênero.
- O teste da paleta continua exigindo 3:1 contra creme **ou** navy.
